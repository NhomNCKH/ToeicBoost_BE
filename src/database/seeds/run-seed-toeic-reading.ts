/**
 * Seed ngân hàng câu hỏi P5–P7 (Reading, không audio/ảnh) + exam template draft gắn manual items.
 *
 * Cấu trúc: P5 × 30 câu (30 nhóm), P6 × 16 câu (4 nhóm × 4), P7 × 24 câu (6 nhóm × 4) = 70 câu (+ seed riêng thêm 9 nhóm P7 nếu cần).
 *
 * Chạy (từ thư mục ToeicBoost_BE):
 *   npm run seed:toeic-reading
 *   hoặc: npx ts-node -r tsconfig-paths/register src/database/seeds/run-seed-toeic-reading.ts
 *
 * .env: DB_* bắt buộc. SEED_USER_EMAIL tùy chọn — nếu không có, seed tự chọn admin/superadmin đầu tiên, sau đó user active đầu tiên.
 * Tùy chọn: SEED_CODE_SUFFIX=... (mặc định demo) — đổi nếu trùng mã SEED-R567-<suffix>
 * Bổ sung P7 không trùng mã seed gốc: `npm run seed:toeic-reading-p7-extra` (xem run-seed-toeic-reading-p7-extra.ts).
 *
 * Nội dung câu hỏi là văn bản mẫu phong cách TOEIC, không sao chép đề ETS.
 */
import * as path from 'path';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { DB_ENTITIES_PATH, getDatabaseConfig } from '../../config/database.config';
import { QuestionPart } from '../../common/constants/question-bank.enum';
import { TemplateMode, TemplateStatus, TemplateItemMode } from '../../common/constants/exam-template.enum';
import { QuestionGroup } from '../../modules/admin/question-bank/entities/question-group.entity';
import { ExamTemplate } from '../../modules/admin/exam-template/entities/exam-template.entity';
import { ExamTemplateSection } from '../../modules/admin/exam-template/entities/exam-template-section.entity';
import { ExamTemplateItem } from '../../modules/admin/exam-template/entities/exam-template-item.entity';
import { buildP5Items, buildP6Passages, buildP7Passages } from './toeic-reading-p567-content';
import {
  ensureReadingSeedTags,
  readingLevelAt,
  resolveSeedUserId,
  saveReadingQuestionGroup,
} from './toeic-reading-seed-shared';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const MAIN_SEED_SOURCE_REF = 'run-seed-toeic-reading';
const MAIN_SEED_META = { seed: 'toeic-reading-p567' };

async function main() {
  const suffix = (process.env.SEED_CODE_SUFFIX ?? 'demo').replace(/[^a-zA-Z0-9_-]/g, '');
  const db = getDatabaseConfig();
  if (!db.password || typeof db.password !== 'string') {
    throw new Error('DB_PASSWORD không hợp lệ — kiểm tra .env');
  }

  const dataSource = new DataSource({
    ...db,
    /** Giống app.module — glob đủ *.entity (QuestionGroupAsset, ExamAttempt, …) */
    entities: [DB_ENTITIES_PATH],
  });

  await dataSource.initialize();
  console.log('DB connected.');

  const userId = await resolveSeedUserId(dataSource);

  const sampleP5Code = `SEED-${suffix}-P5-001`;
  const examCodeEarly = `SEED-R567-${suffix}`;
  const qgRepo = dataSource.getRepository(QuestionGroup);
  const examRepoEarly = dataSource.getRepository(ExamTemplate);

  const [existingGroup, existingExam] = await Promise.all([
    qgRepo.findOne({ where: { code: sampleP5Code } }),
    examRepoEarly.findOne({ where: { code: examCodeEarly } }),
  ]);

  if (existingGroup || existingExam) {
    console.error(
      '\n--- Seed dừng: trùng mã (đã chạy seed với cùng SEED_CODE_SUFFIX trước đó) ---',
    );
    if (existingGroup) {
      console.error(`  - question_groups.code đã có: ${sampleP5Code}`);
    }
    if (existingExam) {
      console.error(`  - exam_templates.code đã có: ${examCodeEarly}`);
    }
    console.error('\nChạy lại với hậu tố KHÁC, ví dụ PowerShell:');
    console.error('  $env:SEED_CODE_SUFFIX="v2"; npm run seed:toeic-reading');
    console.error('Hoặc CMD:');
    console.error('  set SEED_CODE_SUFFIX=v2&& npm run seed:toeic-reading\n');
    await dataSource.destroy();
    process.exit(1);
  }

  const tagsByCode = await ensureReadingSeedTags(dataSource, userId);

  const p5Items = buildP5Items();
  const p6Passages = buildP6Passages();
  const p7Passages = buildP7Passages();

  const p5Groups: QuestionGroup[] = [];
  for (let i = 0; i < p5Items.length; i++) {
    const mcq = p5Items[i];
    const g = await saveReadingQuestionGroup(dataSource, {
      userId,
      code: `SEED-${suffix}-P5-${String(i + 1).padStart(3, '0')}`,
      title: `P5 Incomplete — ${i + 1}`,
      part: QuestionPart.P5,
      level: readingLevelAt(i),
      stem: null,
      tags: [tagsByCode['grammar:word_form'], tagsByCode['vocab:general']],
      questions: [mcq],
      sourceRef: MAIN_SEED_SOURCE_REF,
      seedMeta: MAIN_SEED_META,
    });
    p5Groups.push(g);
  }

  const p6Groups: QuestionGroup[] = [];
  for (let p = 0; p < p6Passages.length; p++) {
    const passage = p6Passages[p];
    const g = await saveReadingQuestionGroup(dataSource, {
      userId,
      code: `SEED-${suffix}-P6-${String(p + 1).padStart(2, '0')}`,
      title: `P6 Text completion — passage ${p + 1}`,
      part: QuestionPart.P6,
      level: readingLevelAt(p + 10),
      stem: passage.stem,
      tags: [tagsByCode['grammar:preposition'], tagsByCode['reading:detail']],
      questions: passage.items,
      sourceRef: MAIN_SEED_SOURCE_REF,
      seedMeta: MAIN_SEED_META,
    });
    p6Groups.push(g);
  }

  const p7Groups: QuestionGroup[] = [];
  for (let p = 0; p < p7Passages.length; p++) {
    const passage = p7Passages[p];
    const g = await saveReadingQuestionGroup(dataSource, {
      userId,
      code: `SEED-${suffix}-P7-${String(p + 1).padStart(2, '0')}`,
      title: `P7 Reading — set ${p + 1}`,
      part: QuestionPart.P7,
      level: readingLevelAt(p + 20),
      stem: passage.stem,
      tags: [tagsByCode['reading:detail'], tagsByCode['reading:inference']],
      questions: passage.items,
      sourceRef: MAIN_SEED_SOURCE_REF,
      seedMeta: MAIN_SEED_META,
    });
    p7Groups.push(g);
  }

  const totalQuestions =
    p5Items.length +
    p6Passages.reduce((s, x) => s + x.items.length, 0) +
    p7Passages.reduce((s, x) => s + x.items.length, 0);
  const totalGroups = p5Groups.length + p6Groups.length + p7Groups.length;

  const examCode = `SEED-R567-${suffix}`;
  const examRepo = dataSource.getRepository(ExamTemplate);

  const exam = examRepo.create({
    code: examCode,
    name: `[Seed] TOEIC Reading P5–P7 (${suffix})`,
    mode: TemplateMode.MOCK_TEST,
    status: TemplateStatus.DRAFT,
    totalDurationSec: 75 * 60,
    totalQuestions,
    instructions:
      'Đề mẫu chỉ gồm Reading (P5, P6, P7). Dùng để kiểm thử ngân hàng câu hỏi và xuất bản.',
    shuffleQuestionOrder: false,
    shuffleOptionOrder: false,
    publishedAt: null,
    metadata: { seed: 'toeic-reading-p567', parts: ['P5', 'P6', 'P7'] },
    createdById: userId,
  });
  await examRepo.save(exam);

  const secRepo = dataSource.getRepository(ExamTemplateSection);
  const p5ExpectedQ = p5Groups.length;
  const p6ExpectedQ = p6Passages.reduce((s, x) => s + x.items.length, 0);
  const p7ExpectedQ = p7Passages.reduce((s, x) => s + x.items.length, 0);

  const secP5 = secRepo.create({
    examTemplateId: exam.id,
    part: QuestionPart.P5,
    sectionOrder: 1,
    expectedGroupCount: p5Groups.length,
    expectedQuestionCount: p5ExpectedQ,
    durationSec: 25 * 60,
    instructions: 'Part 5 — Incomplete sentences',
    createdById: userId,
  });
  const secP6 = secRepo.create({
    examTemplateId: exam.id,
    part: QuestionPart.P6,
    sectionOrder: 2,
    expectedGroupCount: p6Groups.length,
    expectedQuestionCount: p6ExpectedQ,
    durationSec: 25 * 60,
    instructions: 'Part 6 — Text completion',
    createdById: userId,
  });
  const secP7 = secRepo.create({
    examTemplateId: exam.id,
    part: QuestionPart.P7,
    sectionOrder: 3,
    expectedGroupCount: p7Groups.length,
    expectedQuestionCount: p7ExpectedQ,
    durationSec: 25 * 60,
    instructions: 'Part 7 — Reading comprehension',
    createdById: userId,
  });
  await secRepo.save([secP5, secP6, secP7]);

  const itemRepo = dataSource.getRepository(ExamTemplateItem);
  let order = 1;
  const addItems = async (section: ExamTemplateSection, groups: QuestionGroup[]) => {
    for (const g of groups) {
      await itemRepo.save(
        itemRepo.create({
          examTemplateId: exam.id,
          sectionId: section.id,
          questionGroupId: g.id,
          sourceMode: TemplateItemMode.MANUAL,
          displayOrder: order++,
          locked: false,
          createdById: userId,
        }),
      );
    }
  };

  await addItems(secP5, p5Groups);
  await addItems(secP6, p6Groups);
  await addItems(secP7, p7Groups);

  await dataSource.destroy();

  console.log('--- Seed hoàn tất ---');
  console.log(`User: ${process.env.SEED_USER_EMAIL}`);
  console.log(`Question groups: ${totalGroups} (P5=${p5Groups.length}, P6=${p6Groups.length}, P7=${p7Groups.length})`);
  console.log(`Total questions: ${totalQuestions}`);
  console.log(`Exam template: code=${examCode}, id=${exam.id}, status=draft`);
  console.log('Mở Admin → Đề thi để kiểm tra / xuất bản sau khi validate.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
