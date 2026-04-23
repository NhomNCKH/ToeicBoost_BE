/**
 * Seed chỉ thêm 9 nhóm P7 (mã SEED-P7X-<suffix>-NN) — không tạo exam template.
 * Dùng khi đã chạy `seed:toeic-reading` và cần bổ sung bài đọc P7 mà không trùng mã nhóm cũ.
 *
 * Chạy: npm run seed:toeic-reading-p7-extra
 * .env: DB_* giống seed chính. SEED_USER_EMAIL tùy chọn.
 * Hậu tố: SEED_P7_EXTRA_SUFFIX (mặc định p7x). Nếu trùng, đổi ví dụ: $env:SEED_P7_EXTRA_SUFFIX="p7x2"
 */
import * as path from 'path';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { DB_ENTITIES_PATH, getDatabaseConfig } from '../../config/database.config';
import { QuestionPart } from '../../common/constants/question-bank.enum';
import { QuestionGroup } from '../../modules/admin/question-bank/entities/question-group.entity';
import { buildP7ExtraPassages } from './toeic-reading-p7-extra-content';
import {
  ensureReadingSeedTags,
  readingLevelAt,
  resolveSeedUserId,
  saveReadingQuestionGroup,
} from './toeic-reading-seed-shared';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const SOURCE_REF = 'run-seed-toeic-reading-p7-extra';
const SEED_META = { seed: 'toeic-reading-p7-extra' };

async function main() {
  const suffix = (process.env.SEED_P7_EXTRA_SUFFIX ?? 'p7x').replace(/[^a-zA-Z0-9_-]/g, '');
  const db = getDatabaseConfig();
  if (!db.password || typeof db.password !== 'string') {
    throw new Error('DB_PASSWORD không hợp lệ — kiểm tra .env');
  }

  const dataSource = new DataSource({
    ...db,
    entities: [DB_ENTITIES_PATH],
  });

  await dataSource.initialize();
  console.log('DB connected (P7 extra seed).');

  const userId = await resolveSeedUserId(dataSource);
  const sampleCode = `SEED-P7X-${suffix}-01`;
  const existing = await dataSource.getRepository(QuestionGroup).findOne({ where: { code: sampleCode } });
  if (existing) {
    console.error('\n--- Seed P7 extra dừng: mã đã tồn tại ---');
    console.error(`  question_groups.code=${sampleCode}`);
    console.error('Đổi SEED_P7_EXTRA_SUFFIX rồi chạy lại, ví dụ PowerShell:');
    console.error('  $env:SEED_P7_EXTRA_SUFFIX="p7x2"; npm run seed:toeic-reading-p7-extra\n');
    await dataSource.destroy();
    process.exit(1);
  }

  const tagsByCode = await ensureReadingSeedTags(dataSource, userId);
  const passages = buildP7ExtraPassages();
  const groups: QuestionGroup[] = [];

  for (let p = 0; p < passages.length; p++) {
    const passage = passages[p];
    const g = await saveReadingQuestionGroup(dataSource, {
      userId,
      code: `SEED-P7X-${suffix}-${String(p + 1).padStart(2, '0')}`,
      title: `P7 Reading (extra) — set ${p + 1}`,
      part: QuestionPart.P7,
      level: readingLevelAt(p + 50),
      stem: passage.stem,
      tags: [tagsByCode['reading:detail'], tagsByCode['reading:inference']],
      questions: passage.items,
      sourceRef: SOURCE_REF,
      seedMeta: SEED_META,
    });
    groups.push(g);
  }

  const totalQ = passages.reduce((s, x) => s + x.items.length, 0);
  await dataSource.destroy();

  console.log('--- Seed P7 extra hoàn tất ---');
  console.log(`Đã tạo ${groups.length} nhóm P7, ${totalQ} câu.`);
  console.log('Mã nhóm: SEED-P7X-' + suffix + '-01 …');
  console.log('Vào Admin → Ngân hàng câu hỏi / Đề thi để gán thủ công vào đề (tab Câu hỏi).');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
