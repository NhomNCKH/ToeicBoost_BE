import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { paginate } from '@helpers/pagination.helper';
import { VocabularyDeck } from './entities/vocabulary-deck.entity';
import { VocabularyItem } from './entities/vocabulary-item.entity';
import type {
  AdminListVocabularyDecksQueryDto,
  AdminListVocabularyItemsQueryDto,
  BulkCreateVocabularyItemsDto,
  CreateVocabularyDeckDto,
  CreateVocabularyItemDto,
  LearnerListVocabularyDecksQueryDto,
  LearnerListVocabularyItemsQueryDto,
  UpdateVocabularyDeckDto,
  UpdateVocabularyItemDto,
} from './dto/vocabulary.dto';

@Injectable()
export class VocabularyService {
  constructor(
    @InjectRepository(VocabularyDeck)
    private readonly deckRepo: Repository<VocabularyDeck>,
    @InjectRepository(VocabularyItem)
    private readonly itemRepo: Repository<VocabularyItem>,
  ) {}

  private async itemCountForDeck(deckId: string): Promise<number> {
    return this.itemRepo.count({
      where: { deckId, deletedAt: IsNull() },
    });
  }

  // ---- Admin decks ----
  async adminListDecks(query: AdminListVocabularyDecksQueryDto, userId: string) {
    const qb = this.deckRepo
      .createQueryBuilder('d')
      .where('d.deletedAt IS NULL');

    if (query.cefrLevel) {
      qb.andWhere('d.cefrLevel = :cefr', { cefr: query.cefrLevel });
    }
    if (typeof query.published === 'boolean') {
      qb.andWhere('d.published = :pub', { pub: query.published });
    }
    if (query.keyword?.trim()) {
      const kw = `%${query.keyword.trim()}%`;
      qb.andWhere('(d.title ILIKE :kw OR d.description ILIKE :kw)', { kw });
    }

    const allowedSorts = new Set(['createdAt', 'updatedAt', 'title', 'sortOrder', 'cefrLevel']);
    const sort = allowedSorts.has(query.sort ?? '') ? query.sort! : 'sortOrder';
    const order = query.order === 'ASC' ? 'ASC' : 'DESC';

    const result = await paginate(qb, { ...query, sort, order });

    const itemsWithCount = await Promise.all(
      result.data.map(async (deck) => ({
        ...deck,
        itemCount: await this.itemCountForDeck(deck.id),
      })),
    );

    return { items: itemsWithCount, meta: result.pagination };
  }

  async adminCreateDeck(dto: CreateVocabularyDeckDto, userId: string) {
    const deck = this.deckRepo.create({
      title: dto.title.trim(),
      cefrLevel: dto.cefrLevel,
      description: dto.description?.trim() || null,
      published: dto.published ?? false,
      sortOrder: dto.sortOrder ?? 0,
      createdById: userId,
    });
    return this.deckRepo.save(deck);
  }

  async adminGetDeck(deckId: string) {
    const deck = await this.deckRepo.findOne({
      where: { id: deckId, deletedAt: IsNull() },
    });
    if (!deck) throw new NotFoundException('Không tìm thấy bộ từ');
    const itemCount = await this.itemCountForDeck(deckId);
    return { ...deck, itemCount };
  }

  async adminUpdateDeck(deckId: string, dto: UpdateVocabularyDeckDto, userId: string) {
    const deck = await this.deckRepo.findOne({
      where: { id: deckId, deletedAt: IsNull() },
    });
    if (!deck) throw new NotFoundException('Không tìm thấy bộ từ');

    if (typeof dto.title === 'string') deck.title = dto.title.trim();
    if (dto.cefrLevel) deck.cefrLevel = dto.cefrLevel;
    if (dto.description !== undefined) {
      deck.description =
        dto.description === null || dto.description === ''
          ? null
          : String(dto.description).trim();
    }
    if (typeof dto.published === 'boolean') deck.published = dto.published;
    if (typeof dto.sortOrder === 'number') deck.sortOrder = dto.sortOrder;
    deck.createdById = deck.createdById ?? userId;

    return this.deckRepo.save(deck);
  }

  async adminDeleteDeck(deckId: string) {
    const deck = await this.deckRepo.findOne({
      where: { id: deckId, deletedAt: IsNull() },
    });
    if (!deck) throw new NotFoundException('Không tìm thấy bộ từ');
    deck.deletedAt = new Date();
    await this.deckRepo.save(deck);
    return { deleted: true };
  }

  // ---- Admin items ----
  async adminListItems(deckId: string, query: AdminListVocabularyItemsQueryDto) {
    await this.adminGetDeck(deckId);

    const qb = this.itemRepo
      .createQueryBuilder('i')
      .where('i.deckId = :deckId', { deckId })
      .andWhere('i.deletedAt IS NULL');

    if (query.keyword?.trim()) {
      const kw = `%${query.keyword.trim()}%`;
      qb.andWhere(
        '(i.word ILIKE :kw OR i.meaning ILIKE :kw OR i.exampleSentence ILIKE :kw OR i.wordType ILIKE :kw OR i.pronunciation ILIKE :kw)',
        { kw },
      );
    }

    const allowedSorts = new Set(['createdAt', 'updatedAt', 'word', 'sortOrder']);
    const sort = allowedSorts.has(query.sort ?? '') ? query.sort! : 'sortOrder';
    const order = query.order === 'ASC' ? 'ASC' : 'DESC';

    const result = await paginate(qb, { ...query, sort, order });
    return { items: result.data, meta: result.pagination };
  }

  async adminCreateItem(deckId: string, dto: CreateVocabularyItemDto, userId: string) {
    await this.adminGetDeck(deckId);
    const item = this.itemRepo.create({
      deckId,
      word: dto.word.trim(),
      wordType: dto.wordType.trim(),
      meaning: dto.meaning.trim(),
      pronunciation:
        dto.pronunciation != null && String(dto.pronunciation).trim() !== ''
          ? String(dto.pronunciation).trim()
          : null,
      exampleSentence: dto.exampleSentence.trim(),
      sortOrder: dto.sortOrder ?? 0,
      createdById: userId,
    });
    return this.itemRepo.save(item);
  }

  async adminBulkCreateItems(deckId: string, dto: BulkCreateVocabularyItemsDto, userId: string) {
    await this.adminGetDeck(deckId);
    if (!dto.items?.length) {
      throw new BadRequestException('Danh sách từ rỗng');
    }
    const entities = dto.items.map((row, idx) =>
      this.itemRepo.create({
        deckId,
        word: row.word.trim(),
        wordType: row.wordType.trim(),
        meaning: row.meaning.trim(),
        pronunciation:
          row.pronunciation != null && String(row.pronunciation).trim() !== ''
            ? String(row.pronunciation).trim()
            : null,
        exampleSentence: row.exampleSentence.trim(),
        sortOrder: row.sortOrder ?? idx,
        createdById: userId,
      }),
    );
    await this.itemRepo.save(entities);
    return { inserted: entities.length };
  }

  async adminUpdateItem(
    deckId: string,
    itemId: string,
    dto: UpdateVocabularyItemDto,
    userId: string,
  ) {
    const item = await this.itemRepo.findOne({
      where: { id: itemId, deckId, deletedAt: IsNull() },
    });
    if (!item) throw new NotFoundException('Không tìm thấy mục từ vựng');

    if (typeof dto.word === 'string') item.word = dto.word.trim();
    if (typeof dto.wordType === 'string') item.wordType = dto.wordType.trim();
    if (typeof dto.meaning === 'string') item.meaning = dto.meaning.trim();
    if (dto.pronunciation !== undefined) {
      item.pronunciation =
        dto.pronunciation == null || String(dto.pronunciation).trim() === ''
          ? null
          : String(dto.pronunciation).trim();
    }
    if (typeof dto.exampleSentence === 'string') {
      item.exampleSentence = dto.exampleSentence.trim();
    }
    if (typeof dto.sortOrder === 'number') item.sortOrder = dto.sortOrder;
    item.createdById = item.createdById ?? userId;

    return this.itemRepo.save(item);
  }

  async adminDeleteItem(deckId: string, itemId: string) {
    const item = await this.itemRepo.findOne({
      where: { id: itemId, deckId, deletedAt: IsNull() },
    });
    if (!item) throw new NotFoundException('Không tìm thấy mục từ vựng');
    item.deletedAt = new Date();
    await this.itemRepo.save(item);
    return { deleted: true };
  }

  // ---- Learner ----
  async learnerListDecks(query: LearnerListVocabularyDecksQueryDto) {
    const qb = this.deckRepo
      .createQueryBuilder('d')
      .where('d.deletedAt IS NULL')
      .andWhere('d.published = true');

    if (query.cefrLevel) {
      qb.andWhere('d.cefrLevel = :cefr', { cefr: query.cefrLevel });
    }
    if (query.keyword?.trim()) {
      const kw = `%${query.keyword.trim()}%`;
      qb.andWhere('(d.title ILIKE :kw OR d.description ILIKE :kw)', { kw });
    }

    const allowedSorts = new Set(['createdAt', 'updatedAt', 'title', 'sortOrder', 'cefrLevel']);
    const sort = allowedSorts.has(query.sort ?? '') ? query.sort! : 'sortOrder';
    const order = query.order === 'ASC' ? 'ASC' : 'DESC';

    const result = await paginate(qb, { ...query, sort, order });

    const itemsWithCount = await Promise.all(
      result.data.map(async (deck) => ({
        ...deck,
        itemCount: await this.itemCountForDeck(deck.id),
      })),
    );

    return { items: itemsWithCount, meta: result.pagination };
  }

  async learnerGetDeck(deckId: string) {
    const deck = await this.deckRepo.findOne({
      where: { id: deckId, deletedAt: IsNull(), published: true },
    });
    if (!deck) throw new NotFoundException('Không tìm thấy bộ từ hoặc chưa được xuất bản');
    const itemCount = await this.itemCountForDeck(deckId);
    return { ...deck, itemCount };
  }

  async learnerListItems(deckId: string, query: LearnerListVocabularyItemsQueryDto) {
    await this.learnerGetDeck(deckId);

    const qb = this.itemRepo
      .createQueryBuilder('i')
      .where('i.deckId = :deckId', { deckId })
      .andWhere('i.deletedAt IS NULL');

    if (query.keyword?.trim()) {
      const kw = `%${query.keyword.trim()}%`;
      qb.andWhere(
        '(i.word ILIKE :kw OR i.meaning ILIKE :kw OR i.exampleSentence ILIKE :kw OR i.pronunciation ILIKE :kw)',
        { kw },
      );
    }

    const allowedSorts = new Set(['createdAt', 'updatedAt', 'word', 'sortOrder']);
    const sort = allowedSorts.has(query.sort ?? '') ? query.sort! : 'sortOrder';
    const order = query.order === 'ASC' ? 'ASC' : 'DESC';

    const result = await paginate(qb, { ...query, sort, order });
    return { items: result.data, meta: result.pagination };
  }
}
