import { BadRequestException } from '@nestjs/common';

jest.mock(
  '@helpers/pagination.helper',
  () => ({
    paginate: jest.fn(),
  }),
  { virtual: true },
);

jest.mock(
  '@modules/ai-tutor/ai-tutor.service',
  () => ({
    AiTutorService: class AiTutorService {},
  }),
  { virtual: true },
);

const { FlashcardsService } = require('./flashcards.service') as {
  FlashcardsService: typeof import('./flashcards.service').FlashcardsService;
};

describe('FlashcardsService', () => {
  function createService() {
    const savedPayloads: unknown[] = [];
    const deckRepo = {
      findOne: jest.fn(async ({ where }: { where: { id: string; userId: string } }) => ({
        id: where.id,
        userId: where.userId,
        title: 'Deck test',
        deletedAt: null,
      })),
    };
    const cardRepo = {
      create: jest.fn((payload: unknown) => payload),
      save: jest.fn(async (payload: unknown) => {
        savedPayloads.push(payload);
        return payload;
      }),
    };
    const noopRepo = {};
    const aiTutorService = {
      generateFlashcardSet: jest.fn(async () => ({
        model: 'mock-model',
        formatVersion: 'v1',
        result: {
          title: 'AI Preview',
          warnings: ['mock warning'],
          cards: [
            {
              front: 'attend',
              back: 'tham dự',
              metadata: {
                expression: 'attend',
                meaningVi: 'tham dự',
                pronunciation: '/əˈtend/',
                source: 'ai_generated',
                contentType: 'vocabulary',
                level: 'B1',
              },
              tags: ['toeic', 'meeting', 'toeic'],
            },
          ],
        },
      })),
    };

    const service = new FlashcardsService(
      deckRepo as never,
      cardRepo as never,
      noopRepo as never,
      noopRepo as never,
      aiTutorService as never,
    );

    return {
      service,
      cardRepo,
      savedPayloads,
      aiTutorService,
    };
  }

  it('normalizes JSON preview and does not expose metadata.version', () => {
    const { service } = createService();

    const result = service.previewFromJson({
      rawJson: JSON.stringify({
        title: 'JSON test',
        cards: [
          { front: 'attend', back: 'tham dự', tags: ['toeic', 'meeting', 'Toeic'] },
          { word: 'agenda', meaningVi: 'chương trình họp', partOfSpeech: 'noun', tags: 'business,meeting' },
        ],
      }),
    });

    expect(result.title).toBe('JSON test');
    expect(result.source).toBe('json_import');
    expect(result.items).toHaveLength(2);
    expect(result.items[0].metadata).not.toHaveProperty('version');
    expect(result.items[1]).toMatchObject({
      front: 'agenda',
      back: 'chương trình họp',
      tags: ['business', 'meeting'],
      metadata: {
        expression: 'agenda',
        meaningVi: 'chương trình họp',
        partOfSpeech: 'noun',
        source: 'json_import',
      },
    });
  });

  it('rejects JSON preview when item count exceeds limit', () => {
    const { service } = createService();

    expect(() =>
      service.previewFromJson({
        rawJson: JSON.stringify(
          Array.from({ length: 101 }, (_, index) => ({
            front: `word-${index + 1}`,
            back: `meaning-${index + 1}`,
          })),
        ),
      }),
    ).toThrow('Tối đa 100 flashcard cho mỗi lần preview');
  });

  it('normalizes AI preview and keeps warnings/model metadata', async () => {
    const { service, aiTutorService } = createService();

    const result = await service.previewFromAi({
      topic: 'TOEIC meetings',
      language: 'en-vi',
      level: 'B1',
      cardCount: 1,
      contentType: 'vocabulary',
      requirements: 'short example',
    });

    expect(aiTutorService.generateFlashcardSet).toHaveBeenCalled();
    expect(result.model).toBe('mock-model');
    expect(result.formatVersion).toBe('v1');
    expect(result.warnings).toEqual(['mock warning']);
    expect(result.items[0].metadata).not.toHaveProperty('version');
    expect(result.items[0].metadata).toMatchObject({
      expression: 'attend',
      meaningVi: 'tham dự',
      pronunciation: '/əˈtend/',
      source: 'ai_generated',
      contentType: 'vocabulary',
      level: 'B1',
    });
  });

  it('rejects AI preview when provider returns no valid cards', async () => {
    const { service } = createService();

    Object.assign(service as unknown as { aiTutorService: unknown }, {
      aiTutorService: {
        generateFlashcardSet: jest.fn(async () => ({
          model: 'mock-model',
          formatVersion: 'v1',
          result: {
            title: 'AI Preview',
            warnings: [],
            cards: [],
          },
        })),
      },
    });

    await expect(
      service.previewFromAi({
        topic: 'TOEIC meetings',
        language: 'en-vi',
        level: 'B1',
        cardCount: 1,
        contentType: 'vocabulary',
        requirements: 'short example',
      }),
    ).rejects.toThrow('AI không tạo được flashcard hợp lệ để xem trước');
  });

  it('accepts preview items that still contain metadata.version when saving', async () => {
    const { service, cardRepo, savedPayloads } = createService();

    const result = await service.bulkCreateCards(
      'deck-1',
      {
        items: [
          {
            front: 'attend',
            back: 'tham dự',
            tags: ['toeic', 'meeting'],
            metadata: {
              version: 1,
              expression: 'attend',
              meaningVi: 'tham dự',
              pronunciation: '/əˈtend/',
              source: 'ai_generated',
              contentType: 'vocabulary',
              level: 'B1',
            },
          },
        ],
      },
      'user-1',
    );

    expect(result).toEqual({
      inserted: 1,
      deckId: 'deck-1',
    });
    expect(cardRepo.save).toHaveBeenCalledTimes(1);
    expect(savedPayloads).toHaveLength(1);
    expect(savedPayloads[0]).toEqual([
      expect.objectContaining({
        deckId: 'deck-1',
        front: 'attend',
        back: 'tham dự',
        createdById: 'user-1',
        tags: ['toeic', 'meeting'],
        note: expect.stringMatching(/^__VOCAB_META_V1__/),
      }),
    ]);
  });

  it('keeps old manual createCard flow unchanged', async () => {
    const { service, cardRepo } = createService();

    const result = await service.createCard(
      'deck-1',
      {
        front: ' attend ',
        back: ' tham dự ',
        note: ' manual note ',
        tags: [' toeic ', '', 'meeting '],
      },
      'user-1',
    );

    expect(cardRepo.create).toHaveBeenCalledWith({
      deckId: 'deck-1',
      front: 'attend',
      back: 'tham dự',
      note: 'manual note',
      tags: ['toeic', 'meeting'],
      createdById: 'user-1',
    });
    expect(result).toEqual({
      deckId: 'deck-1',
      front: 'attend',
      back: 'tham dự',
      note: 'manual note',
      tags: ['toeic', 'meeting'],
      createdById: 'user-1',
    });
  });

  it('rejects invalid preview and bulk items', async () => {
    const { service } = createService();

    expect(() =>
      service.previewFromJson({
        rawJson: '{"title":"bad"}',
      }),
    ).toThrow(BadRequestException);

    await expect(
      service.bulkCreateCards(
        'deck-1',
        {
          items: [{ front: '  ', back: 'x' }],
        },
        'user-1',
      ),
    ).rejects.toThrow(
      'Flashcard ở vị trí 1 không hợp lệ khi lưu: Mỗi flashcard phải có front và back hợp lệ',
    );
  });
});
