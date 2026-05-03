import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginate } from '@helpers/pagination.helper';
import { IsNull } from 'typeorm';
import { AiTutorService } from '@modules/ai-tutor/ai-tutor.service';
import { FlashcardDeck } from './entities/flashcard-deck.entity';
import { Flashcard } from './entities/flashcard.entity';
import { FlashcardProgress } from './entities/flashcard-progress.entity';
import { FlashcardReviewLog } from './entities/flashcard-review-log.entity';
import type {
  CreateFlashcardDeckDto,
  CreateFlashcardDto,
  LearnerBulkCreateFlashcardsDto,
  LearnerListDeckFlashcardsQueryDto,
  LearnerListDecksQueryDto,
  LearnerPreviewFlashcardsFromAiDto,
  LearnerPreviewFlashcardsFromJsonDto,
  LearnerStudyQueueQueryDto,
  LearnerSubmitReviewDto,
  UpdateFlashcardDeckDto,
  UpdateFlashcardDto,
} from './dto/flashcards.dto';
import {
  buildBackFromStructuredMetadata,
  cleanStringArray,
  serializeStructuredFlashcardMetadata,
  StructuredFlashcardMetadata,
} from './flashcard-metadata.util';

@Injectable()
export class FlashcardsService {
  private static readonly allowedSources = new Set([
    'manual',
    'json_import',
    'ai_generated',
  ]);

  private static readonly allowedContentTypes = new Set([
    'vocabulary',
    'phrase',
    'collocation',
    'sentence',
    'mixed',
  ]);

  constructor(
    @InjectRepository(FlashcardDeck)
    private readonly deckRepo: Repository<FlashcardDeck>,
    @InjectRepository(Flashcard)
    private readonly cardRepo: Repository<Flashcard>,
    @InjectRepository(FlashcardProgress)
    private readonly progressRepo: Repository<FlashcardProgress>,
    @InjectRepository(FlashcardReviewLog)
    private readonly logRepo: Repository<FlashcardReviewLog>,
    private readonly aiTutorService: AiTutorService,
  ) {}

  private toCleanText(value: unknown, maxLength: number) {
    const text = typeof value === 'string' ? value.trim() : '';
    return text ? text.slice(0, maxLength) : '';
  }

  private pickText(maxLength: number, ...values: unknown[]) {
    for (const value of values) {
      const cleaned = this.toCleanText(value, maxLength);
      if (cleaned) return cleaned;
    }
    return '';
  }

  private toNormalizedTags(...values: unknown[]) {
    const merged = values.flatMap((value) => {
      if (typeof value === 'string') {
        return value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
      }
      return cleanStringArray(value, 20, 80);
    });

    return Array.from(
      new Set(
        merged
          .map((tag) => this.toCleanText(tag, 80).toLowerCase())
          .filter(Boolean),
      ),
    ).slice(0, 20);
  }

  private toAllowedSource(
    value: unknown,
    fallbackSource: 'manual' | 'json_import' | 'ai_generated',
  ) {
    const normalized = this.toCleanText(value, 30).toLowerCase();
    return FlashcardsService.allowedSources.has(normalized)
      ? (normalized as 'manual' | 'json_import' | 'ai_generated')
      : fallbackSource;
  }

  private toAllowedContentType(value: unknown) {
    const normalized = this.toCleanText(value, 50).toLowerCase();
    return FlashcardsService.allowedContentTypes.has(normalized) ? normalized : undefined;
  }

  private toStructuredMetadata(
    item: Record<string, unknown>,
    fallbackSource: 'manual' | 'json_import' | 'ai_generated',
  ): StructuredFlashcardMetadata | null {
    const rawMetadata =
      item.metadata && typeof item.metadata === 'object'
        ? (item.metadata as Record<string, unknown>)
        : {};

    const expression = this.pickText(
      2000,
      rawMetadata.expression,
      item.expression,
      item.word,
      item.term,
      item.front,
    );

    if (!expression) return null;

    const tags = this.toNormalizedTags(rawMetadata.tags, item.tags);

    return {
      version: 1,
      expression,
      partOfSpeech: this.pickText(
        100,
        rawMetadata.partOfSpeech,
        item.partOfSpeech,
        item.wordType,
      ),
      pronunciation: this.pickText(
        200,
        rawMetadata.pronunciation,
        item.pronunciation,
        item.ipa,
      ),
      meaningVi: this.pickText(
        5000,
        rawMetadata.meaningVi,
        item.meaningVi,
        item.translation,
        item.meaning,
      ),
      meaningEn: this.pickText(5000, rawMetadata.meaningEn, item.meaningEn),
      phrasalVerbs: cleanStringArray(
        rawMetadata.phrasalVerbs ?? item.phrasalVerbs,
        10,
        120,
      ),
      synonyms: cleanStringArray(rawMetadata.synonyms ?? item.synonyms, 12, 120),
      antonyms: cleanStringArray(rawMetadata.antonyms ?? item.antonyms, 12, 120),
      exampleEn: this.pickText(
        5000,
        rawMetadata.exampleEn,
        item.exampleEn,
        item.exampleSentence,
        item.example,
      ),
      exampleVi: this.pickText(5000, rawMetadata.exampleVi, item.exampleVi),
      note: this.pickText(5000, rawMetadata.note, item.note),
      source: this.toAllowedSource(rawMetadata.source, fallbackSource),
      level: this.pickText(20, rawMetadata.level, item.level),
      contentType: this.toAllowedContentType(
        rawMetadata.contentType ?? item.contentType,
      ),
      tags,
    };
  }

  private normalizePreviewItem(
    raw: unknown,
    fallbackSource: 'manual' | 'json_import' | 'ai_generated',
  ) {
    const item =
      raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : ({} as Record<string, unknown>);

    const metadata = this.toStructuredMetadata(item, fallbackSource);
    const front = this.pickText(2000, item.front, metadata?.expression, item.word, item.term);
    const back = this.pickText(
      5000,
      item.back,
      buildBackFromStructuredMetadata(metadata),
      item.meaning,
      item.translation,
      item.meaningVi,
      item.meaningEn,
    );

    if (!front || !back) {
      throw new BadRequestException('Mỗi flashcard phải có front và back hợp lệ');
    }

    const tags = this.toNormalizedTags(item.tags, metadata?.tags);
    const legacyNote = this.toCleanText(item.note, 5000);

    return {
      front,
      back,
      tags,
      metadata,
      note: metadata ? undefined : legacyNote || undefined,
    };
  }

  private toPreviewResponseItem(
    item: ReturnType<FlashcardsService['normalizePreviewItem']>,
  ) {
    const metadata = item.metadata
      ? (() => {
          const { version: _version, ...rest } = item.metadata;
          return rest;
        })()
      : undefined;

    return {
      ...item,
      metadata,
    };
  }

  private toCardEntityPayload(
    deckId: string,
    item: ReturnType<FlashcardsService['normalizePreviewItem']>,
    userId: string,
  ) {
    const note =
      serializeStructuredFlashcardMetadata(item.metadata ?? null) ?? item.note ?? null;

    return this.cardRepo.create({
      deckId,
      front: item.front.trim(),
      back: item.back.trim(),
      note,
      tags: item.tags.length ? item.tags : null,
      createdById: userId,
    });
  }

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

  previewFromJson(dto: LearnerPreviewFlashcardsFromJsonDto) {
    let parsed: unknown;

    try {
      parsed = JSON.parse(dto.rawJson);
    } catch {
      throw new BadRequestException('JSON không hợp lệ');
    }

    const wrapper =
      parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null;

    const rawItems = Array.isArray(parsed)
      ? parsed
      : Array.isArray(wrapper?.cards)
        ? wrapper.cards
        : Array.isArray(wrapper?.items)
          ? wrapper.items
          : null;

    if (!rawItems) {
      throw new BadRequestException(
        'JSON phải là mảng flashcards hoặc object có trường cards/items',
      );
    }

    if (!rawItems.length) {
      throw new BadRequestException('Danh sách flashcard rỗng');
    }

    if (rawItems.length > 100) {
      throw new BadRequestException('Tối đa 100 flashcard cho mỗi lần preview');
    }

    const items = rawItems.map((item, index) => {
      try {
        return this.toPreviewResponseItem(
          this.normalizePreviewItem(item, 'json_import'),
        );
      } catch (error) {
        throw new BadRequestException(
          `Flashcard ở vị trí ${index + 1} không hợp lệ: ${(error as Error).message}`,
        );
      }
    });

    return {
      title: this.toCleanText(wrapper?.title, 200) || 'JSON Import Preview',
      items,
      warnings: [],
      source: 'json_import' as const,
    };
  }

  async previewFromAi(dto: LearnerPreviewFlashcardsFromAiDto) {
    const generated = await this.aiTutorService.generateFlashcardSet({
      topic: dto.topic,
      language: dto.language,
      level: dto.level,
      cardCount: dto.cardCount,
      contentType: dto.contentType,
      requirements: dto.requirements,
    });

    const items = generated.result.cards.map((item, index) => {
      try {
        return this.toPreviewResponseItem(
          this.normalizePreviewItem(item, 'ai_generated'),
        );
      } catch (error) {
        throw new BadRequestException(
          `AI trả về flashcard không hợp lệ ở vị trí ${index + 1}: ${(error as Error).message}`,
        );
      }
    });

    if (!items.length) {
      throw new BadRequestException('AI không tạo được flashcard hợp lệ để xem trước');
    }

    return {
      title: generated.result.title,
      items,
      warnings: generated.result.warnings,
      source: 'ai_generated' as const,
      model: generated.model,
      formatVersion: generated.formatVersion,
    };
  }

  async bulkCreateCards(
    deckId: string,
    dto: LearnerBulkCreateFlashcardsDto,
    userId: string,
  ) {
    await this.getDeck(deckId, userId);

    if (!dto.items?.length) {
      throw new BadRequestException('Danh sách flashcard rỗng');
    }

    const normalizedItems = dto.items.map((item, index) => {
      try {
        return this.normalizePreviewItem(item, 'manual');
      } catch (error) {
        throw new BadRequestException(
          `Flashcard ở vị trí ${index + 1} không hợp lệ khi lưu: ${(error as Error).message}`,
        );
      }
    });

    const entities = normalizedItems.map((item) => this.toCardEntityPayload(deckId, item, userId));
    await this.cardRepo.save(entities);

    return {
      inserted: entities.length,
      deckId,
    };
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
