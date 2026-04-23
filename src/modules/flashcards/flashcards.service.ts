import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginate } from '@helpers/pagination.helper';
import { IsNull } from 'typeorm';
import { FlashcardDeck } from './entities/flashcard-deck.entity';
import { Flashcard } from './entities/flashcard.entity';
import { FlashcardProgress } from './entities/flashcard-progress.entity';
import { FlashcardReviewLog } from './entities/flashcard-review-log.entity';
import type {
  CreateFlashcardDeckDto,
  CreateFlashcardDto,
  LearnerListDeckFlashcardsQueryDto,
  LearnerListDecksQueryDto,
  LearnerStudyQueueQueryDto,
  LearnerSubmitReviewDto,
  UpdateFlashcardDeckDto,
  UpdateFlashcardDto,
} from './dto/flashcards.dto';

@Injectable()
export class FlashcardsService {
  constructor(
    @InjectRepository(FlashcardDeck)
    private readonly deckRepo: Repository<FlashcardDeck>,
    @InjectRepository(Flashcard)
    private readonly cardRepo: Repository<Flashcard>,
    @InjectRepository(FlashcardProgress)
    private readonly progressRepo: Repository<FlashcardProgress>,
    @InjectRepository(FlashcardReviewLog)
    private readonly logRepo: Repository<FlashcardReviewLog>,
  ) {}

  async listDecks(query: LearnerListDecksQueryDto, userId: string) {
    const qb = this.deckRepo
      .createQueryBuilder('d')
      .where('d.userId = :userId', { userId })
      .andWhere('d.deletedAt IS NULL');

    if (query.keyword) {
      qb.andWhere('(d.title ILIKE :kw OR d.description ILIKE :kw)', {
        kw: `%${query.keyword}%`,
      });
    }

    const allowedSorts = new Set(['createdAt', 'updatedAt', 'title']);
    const sort = allowedSorts.has(query.sort ?? '') ? query.sort : 'updatedAt';
    const order = query.order === 'ASC' ? 'ASC' : 'DESC';

    const result = await paginate(qb, {
      ...query,
      sort,
      order,
    });

    return {
      items: result.data,
      meta: result.pagination,
    };
  }

  async createDeck(dto: CreateFlashcardDeckDto, userId: string) {
    const deck = this.deckRepo.create({
      userId,
      title: dto.title.trim(),
      description: dto.description?.trim() || null,
      createdById: userId,
    });
    const saved = await this.deckRepo.save(deck);
    return saved;
  }

  async getDeck(deckId: string, userId: string) {
    const deck = await this.deckRepo.findOne({
      where: { id: deckId, userId, deletedAt: IsNull() },
    });
    if (!deck) throw new NotFoundException('Deck not found');
    return deck;
  }

  async updateDeck(deckId: string, dto: UpdateFlashcardDeckDto, userId: string) {
    const deck = await this.getDeck(deckId, userId);
    if (typeof dto.title === 'string') deck.title = dto.title.trim();
    if (typeof dto.description === 'string') deck.description = dto.description.trim() || null;
    return this.deckRepo.save(deck);
  }

  async deleteDeck(deckId: string, userId: string) {
    const deck = await this.getDeck(deckId, userId);
    deck.deletedAt = new Date();
    await this.deckRepo.save(deck);
    return { deleted: true };
  }

  async listDeckCards(deckId: string, query: LearnerListDeckFlashcardsQueryDto, userId: string) {
    // ownership check via deck
    await this.getDeck(deckId, userId);

    const qb = this.cardRepo
      .createQueryBuilder('c')
      .where('c.deckId = :deckId', { deckId })
      .andWhere('c.deletedAt IS NULL');

    if (query.keyword) {
      qb.andWhere('(c.front ILIKE :kw OR c.back ILIKE :kw OR c.note ILIKE :kw)', {
        kw: `%${query.keyword}%`,
      });
    }
    if (query.tags && query.tags.length > 0) {
      qb.andWhere('c.tags && :tags', { tags: query.tags });
    }

    const allowedSorts = new Set(['createdAt', 'updatedAt']);
    const sort = allowedSorts.has(query.sort ?? '') ? query.sort : 'updatedAt';
    const order = query.order === 'ASC' ? 'ASC' : 'DESC';

    const result = await paginate(qb, { ...query, sort, order });
    return { items: result.data, meta: result.pagination };
  }

  async createCard(deckId: string, dto: CreateFlashcardDto, userId: string) {
    await this.getDeck(deckId, userId);

    const card = this.cardRepo.create({
      deckId,
      front: dto.front.trim(),
      back: dto.back.trim(),
      note: dto.note?.trim() || null,
      tags: dto.tags?.map((t) => t.trim()).filter(Boolean) ?? null,
      createdById: userId,
    });
    return this.cardRepo.save(card);
  }

  private async getCardOwned(cardId: string, userId: string) {
    const qb = this.cardRepo
      .createQueryBuilder('c')
      .innerJoin(FlashcardDeck, 'd', 'd.id = c.deckId')
      .where('c.id = :cardId', { cardId })
      .andWhere('c.deletedAt IS NULL')
      .andWhere('d.userId = :userId', { userId })
      .andWhere('d.deletedAt IS NULL');

    const card = await qb.getOne();
    if (!card) throw new NotFoundException('Flashcard not found');
    return card;
  }

  async updateCard(cardId: string, dto: UpdateFlashcardDto, userId: string) {
    const card = await this.getCardOwned(cardId, userId);
    if (typeof dto.front === 'string') card.front = dto.front.trim();
    if (typeof dto.back === 'string') card.back = dto.back.trim();
    if (typeof dto.note === 'string') card.note = dto.note.trim() || null;
    if (dto.tags) card.tags = dto.tags.map((t) => t.trim()).filter(Boolean);
    return this.cardRepo.save(card);
  }

  async deleteCard(cardId: string, userId: string) {
    const card = await this.getCardOwned(cardId, userId);
    card.deletedAt = new Date();
    await this.cardRepo.save(card);
    return { deleted: true };
  }

  // ---- Study queue & SM-2 scheduling ----

  private now() {
    return new Date();
  }

  private addDays(date: Date, days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  private sm2Schedule(progress: FlashcardProgress, rating: LearnerSubmitReviewDto['rating']) {
    // SM-2 baseline with 4-grade mapping.
    // again -> quality 0..1 (fail)  ; hard -> 3 ; good -> 4 ; easy -> 5
    const quality = rating === 'again' ? 1 : rating === 'hard' ? 3 : rating === 'good' ? 4 : 5;
    const prevEF = Number(progress.easeFactor ?? 2.5);
    let ef = prevEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (ef < 1.3) ef = 1.3;

    let interval = Number(progress.intervalDays ?? 0);
    let reps = Number(progress.reps ?? 0);
    let lapses = Number(progress.lapses ?? 0);

    if (quality < 3) {
      // failure -> relearn soon
      lapses += 1;
      reps = 0;
      interval = 1;
      progress.state = 'relearning';
    } else {
      reps += 1;
      if (reps === 1) interval = rating === 'hard' ? 1 : 1;
      else if (reps === 2) interval = rating === 'hard' ? 3 : 6;
      else {
        interval = Math.round(interval * ef);
        if (rating === 'hard') interval = Math.max(1, Math.round(interval * 0.85));
        if (rating === 'easy') interval = Math.max(1, Math.round(interval * 1.15));
      }
      progress.state = 'review';
    }

    progress.easeFactor = Number(ef.toFixed(2));
    progress.intervalDays = interval;
    progress.reps = reps;
    progress.lapses = lapses;
    progress.lastReviewedAt = this.now();
    progress.dueAt = this.addDays(this.now(), interval);
    progress.suspended = false;

    return progress;
  }

  async getStudyQueue(query: LearnerStudyQueueQueryDto, userId: string) {
    const deck = await this.getDeck(query.deckId, userId);
    const limit = Math.min(Number(query.limit ?? 20), 100);
    const newLimit = Math.min(Number(query.newLimit ?? 10), limit);

    // due cards: progress exists and dueAt <= now and not suspended
    const dueQb = this.cardRepo
      .createQueryBuilder('c')
      .innerJoin(FlashcardProgress, 'p', 'p.flashcardId = c.id AND p.userId = :userId', { userId })
      .where('c.deckId = :deckId', { deckId: deck.id })
      .andWhere('c.deletedAt IS NULL')
      .andWhere('p.suspended = false')
      .andWhere('(p.dueAt IS NULL OR p.dueAt <= now())')
      .orderBy('p.dueAt', 'ASC')
      .limit(limit);

    const dueCards = await dueQb.getMany();

    const remaining = Math.max(limit - dueCards.length, 0);
    const remainingNew = Math.min(remaining, newLimit);

    let newCards: Flashcard[] = [];
    if (remainingNew > 0) {
      // new cards: no progress row for userId
      const newQb = this.cardRepo
        .createQueryBuilder('c')
        .leftJoin(FlashcardProgress, 'p', 'p.flashcardId = c.id AND p.userId = :userId', { userId })
        .where('c.deckId = :deckId', { deckId: deck.id })
        .andWhere('c.deletedAt IS NULL')
        .andWhere('p.id IS NULL')
        .orderBy('c.createdAt', 'DESC')
        .limit(remainingNew);
      newCards = await newQb.getMany();
    }

    return {
      deck: { id: deck.id, title: deck.title },
      items: [...dueCards, ...newCards],
    };
  }

  async submitReview(dto: LearnerSubmitReviewDto, userId: string) {
    const card = await this.getCardOwned(dto.flashcardId, userId);

    const existing = await this.progressRepo.findOne({
      where: { userId, flashcardId: card.id },
    });

    const progress =
      existing ??
      this.progressRepo.create({
        userId,
        flashcardId: card.id,
        createdById: userId,
        state: 'new',
        intervalDays: 0,
        easeFactor: 2.5,
        reps: 0,
        lapses: 0,
        dueAt: this.now(),
        suspended: false,
      });

    const previousDueAt = progress.dueAt ?? null;
    const updated = this.sm2Schedule(progress, dto.rating);
    const saved = await this.progressRepo.save(updated);

    await this.logRepo.save(
      this.logRepo.create({
        userId,
        flashcardId: card.id,
        rating: dto.rating,
        previousDueAt,
        nextDueAt: saved.dueAt ?? null,
        timeMs: typeof dto.timeMs === 'number' ? dto.timeMs : null,
        createdById: userId,
        metadata: {},
      }),
    );

    return {
      flashcardId: card.id,
      rating: dto.rating,
      nextDueAt: saved.dueAt,
      intervalDays: saved.intervalDays,
      easeFactor: saved.easeFactor,
      reps: saved.reps,
      lapses: saved.lapses,
      state: saved.state,
    };
  }
}

