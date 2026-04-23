/**
 * Seed bộ từ TOEIC Boost (A1–C1): mỗi bộ ~30 mục, đầy đủ IPA, loại từ, nghĩa tiếng Việt, ví dụ tiếng Anh.
 *
 * Dữ liệu: src/database/seeds/data/vocabulary-rich-entries.ts
 *
 * Chạy (PowerShell, từ thư mục ToeicBoost_BE):
 *   npm run migration:run
 *   npm run seed:vocabulary
 *
 * Lưu ý: mỗi lần chạy seed sẽ XÓA HẾT mục từ trong các bộ có tiêu đề
 * "Bộ từ TOEIC Boost — A1" … "C1" rồi ghi lại từ đầu (idempotent theo nội dung mẫu).
 */
import * as path from 'path';
import * as dotenv from 'dotenv';
import { DataSource, IsNull } from 'typeorm';
import { DB_ENTITIES_PATH, getDatabaseConfig } from '../../config/database.config';
import { VocabularyDeck } from '../../modules/vocabulary/entities/vocabulary-deck.entity';
import { VocabularyItem } from '../../modules/vocabulary/entities/vocabulary-item.entity';
import { resolveSeedUserId } from './toeic-reading-seed-shared';
import {
  RICH_VOCABULARY_BY_LEVEL,
  type RichVocabLevel,
} from './data/vocabulary-rich-entries';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const SEED_TAG = '__SEED_VOCAB_V2_RICH__';

const LEVELS: RichVocabLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

function deckTitle(level: RichVocabLevel): string {
  return `Bộ từ TOEIC Boost — ${level}`;
}

function deckDescription(level: RichVocabLevel, count: number): string {
  return `${SEED_TAG} Bộ mẫu chi tiết: phiên âm IPA, loại từ, nghĩa tiếng Việt, ví dụ tiếng Anh (${count} mục).`;
}

async function main() {
  const db = getDatabaseConfig();
  if (!db.password || typeof db.password !== 'string') {
    throw new Error('DB_PASSWORD không hợp lệ — kiểm tra .env');
  }

  const dataSource = new DataSource({
    ...db,
    entities: [DB_ENTITIES_PATH],
  });
  await dataSource.initialize();
  console.log('DB connected.');

  const userId = await resolveSeedUserId(dataSource);
  const deckRepo = dataSource.getRepository(VocabularyDeck);
  const itemRepo = dataSource.getRepository(VocabularyItem);

  for (let i = 0; i < LEVELS.length; i++) {
    const level = LEVELS[i];
    const entries = RICH_VOCABULARY_BY_LEVEL[level];
    const title = deckTitle(level);

    let deck = await deckRepo.findOne({
      where: { title, deletedAt: IsNull() },
    });

    if (!deck) {
      deck = deckRepo.create({
        title,
        cefrLevel: level,
        description: deckDescription(level, entries.length),
        published: true,
        sortOrder: i,
        createdById: userId,
      });
      await deckRepo.save(deck);
      console.log(`Created deck ${level}: ${deck.id}`);
    } else {
      deck.description = deckDescription(level, entries.length);
      deck.cefrLevel = level;
      deck.published = true;
      deck.sortOrder = i;
      deck.createdById = deck.createdById ?? userId;
      await deckRepo.save(deck);
      console.log(`Updated deck ${level}: ${deck.id}`);
    }

    const removed = await itemRepo.delete({ deckId: deck.id });
    console.log(`  Cleared ${removed.affected ?? 0} old items.`);

    const items = entries.map((row, idx) =>
      itemRepo.create({
        deckId: deck.id,
        word: row.word,
        wordType: row.wordType,
        meaning: row.meaning,
        pronunciation: row.pronunciation,
        exampleSentence: row.exampleSentence,
        sortOrder: idx,
        createdById: userId,
      }),
    );

    const chunk = 100;
    for (let j = 0; j < items.length; j += chunk) {
      await itemRepo.save(items.slice(j, j + chunk));
    }
    console.log(`  Inserted ${items.length} items for ${level}.`);
  }

  await dataSource.destroy();
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
