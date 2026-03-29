/**
 * Seed ngân hàng câu hỏi P5–P7 (Reading, không audio/ảnh) + exam template draft gắn manual items.
 *
 * Cấu trúc: P5 × 30 câu (30 nhóm), P6 × 16 câu (4 nhóm × 4), P7 × 24 câu (6 nhóm × 4) = 70 câu.
 *
 * Chạy (từ thư mục ToeicBoost_BE):
 *   npm run seed:toeic-reading
 *   hoặc: npx ts-node -r tsconfig-paths/register src/database/seeds/run-seed-toeic-reading.ts
 *
 * .env: DB_* bắt buộc. SEED_USER_EMAIL tùy chọn — nếu không có, seed tự chọn admin/superadmin đầu tiên, sau đó user active đầu tiên.
 * Tùy chọn: SEED_CODE_SUFFIX=... (mặc định demo) — đổi nếu trùng mã SEED-R567-<suffix>
 *
 * Nội dung câu hỏi là văn bản mẫu phong cách TOEIC, không sao chép đề ETS.
 */
import * as path from 'path';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { DB_ENTITIES_PATH, getDatabaseConfig } from '../../config/database.config';
import {
  QuestionPart,
  QuestionLevel,
  QuestionGroupStatus,
} from '../../common/constants/question-bank.enum';
import { TemplateMode, TemplateStatus, TemplateItemMode } from '../../common/constants/exam-template.enum';
import { User } from '../../modules/security/entities/user.entity';
import { UserStatus } from '../../common/constants/user.enum';
import { Role } from '../../modules/admin/rbac/entities/role.entity';
import { UserRoleAssignment } from '../../modules/admin/rbac/entities/user-role.entity';
import { Tag } from '../../modules/admin/question-bank/entities/tag.entity';
import { QuestionGroup } from '../../modules/admin/question-bank/entities/question-group.entity';
import { Question } from '../../modules/admin/question-bank/entities/question.entity';
import { QuestionOption } from '../../modules/admin/question-bank/entities/question-option.entity';
import { QuestionGroupTag } from '../../modules/admin/question-bank/entities/question-group-tag.entity';
import { ExamTemplate } from '../../modules/admin/exam-template/entities/exam-template.entity';
import { ExamTemplateSection } from '../../modules/admin/exam-template/entities/exam-template-section.entity';
import { ExamTemplateItem } from '../../modules/admin/exam-template/entities/exam-template-item.entity';
import {
  buildP5Items,
  buildP6Passages,
  buildP7Passages,
  optionsWithKey,
  type McqDef,
} from './toeic-reading-p567-content';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const LEVELS = [
  QuestionLevel.EASY,
  QuestionLevel.MEDIUM,
  QuestionLevel.HARD,
  QuestionLevel.EXPERT,
];

function levelAt(i: number): QuestionLevel {
  return LEVELS[i % LEVELS.length];
}

async function resolveUserId(ds: DataSource): Promise<string> {
  const email = process.env.SEED_USER_EMAIL?.trim();
  if (email) {
    const user = await ds.getRepository(User).findOne({ where: { email } });
    if (!user) {
      throw new Error(`Không tìm thấy user với email: ${email}`);
    }
    console.log(`Seed: dùng SEED_USER_EMAIL=${email}`);
    return user.id;
  }

  const admin = await ds
    .getRepository(User)
    .createQueryBuilder('u')
    .innerJoin(UserRoleAssignment, 'ur', 'ur.userId = u.id')
    .innerJoin(Role, 'r', 'r.id = ur.roleId')
    .where('r.code IN (:...codes)', { codes: ['superadmin', 'admin'] })
    .andWhere('u.status = :st', { st: UserStatus.ACTIVE })
    .orderBy('u.createdAt', 'ASC')
    .select(['u.id', 'u.email'])
    .getOne();

  if (admin) {
    console.log(
      `Seed: không có SEED_USER_EMAIL — tự chọn admin đầu tiên: ${admin.email}`,
    );
    return admin.id;
  }

  const fallback = await ds.getRepository(User).find({
    where: { status: UserStatus.ACTIVE },
    order: { createdAt: 'ASC' },
    take: 1,
  });
  const u = fallback[0];
  if (u) {
    console.warn(
      `Seed: không có admin/superadmin — dùng user active đầu tiên: ${u.email}`,
    );
    return u.id;
  }

  throw new Error(
    'Không tìm thấy user nào để gán created_by. Tạo ít nhất một user trong DB hoặc đặt SEED_USER_EMAIL trong .env.',
  );
}

async function ensureTags(
  ds: DataSource,
  userId: string,
): Promise<Record<string, Tag>> {
  const defs = [
    { code: 'grammar:word_form', label: 'Word form / grammar', category: 'grammar' },
    { code: 'grammar:preposition', label: 'Prepositions', category: 'grammar' },
    { code: 'reading:detail', label: 'Reading detail', category: 'reading' },
    { code: 'reading:inference', label: 'Inference', category: 'reading' },
    { code: 'vocab:general', label: 'General vocabulary', category: 'vocabulary' },
  ];
  const out: Record<string, Tag> = {};
  const repo = ds.getRepository(Tag);
  for (const d of defs) {
    let t = await repo.findOne({ where: { code: d.code } });
    if (!t) {
      t = repo.create({
        code: d.code,
        label: d.label,
        category: d.category,
        description: 'Auto-created by TOEIC P5–P7 seed',
        createdById: userId,
      });
      await repo.save(t);
    }
    out[d.code] = t;
  }
  return out;
}

async function saveGroupWithQuestions(
  ds: DataSource,
  params: {
    userId: string;
    code: string;
    title: string;
    part: QuestionPart;
    level: QuestionLevel;
    stem: string | null;
    tags: Tag[];
    questions: McqDef[];
  },
): Promise<QuestionGroup> {
  const gRepo = ds.getRepository(QuestionGroup);
  const qRepo = ds.getRepository(Question);
  const oRepo = ds.getRepository(QuestionOption);
  const tRepo = ds.getRepository(QuestionGroupTag);

  const group = gRepo.create({
    code: params.code,
    title: params.title,
    part: params.part,
    level: params.level,
    status: QuestionGroupStatus.PUBLISHED,
    stem: params.stem,
    explanation: null,
    sourceType: 'seed',
    sourceRef: 'run-seed-toeic-reading',
    publishedAt: new Date(),
    deletedAt: null,
    metadata: { seed: 'toeic-reading-p567' },
    createdById: params.userId,
  });
  await gRepo.save(group);

  for (const tag of params.tags) {
    await tRepo.save(
      tRepo.create({
        questionGroupId: group.id,
        tagId: tag.id,
        createdById: params.userId,
      }),
    );
  }

  let qn = 1;
  for (const mcq of params.questions) {
    const q = qRepo.create({
      questionGroupId: group.id,
      questionNo: qn++,
      prompt: mcq.prompt,
      answerKey: mcq.answerKey,
      rationale: mcq.rationale ?? null,
      timeLimitSec: null,
      scoreWeight: '1',
      metadata: {},
      createdById: params.userId,
    });
    await qRepo.save(q);

    const opts = optionsWithKey(mcq.answerKey, mcq.options);
    let so = 0;
    for (const op of opts) {
      await oRepo.save(
        oRepo.create({
          questionId: q.id,
          optionKey: op.key,
          content: op.content,
          isCorrect: op.isCorrect,
          sortOrder: so++,
          createdById: params.userId,
        }),
      );
    }
  }

  return group;
}

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

  const userId = await resolveUserId(dataSource);
  const tagsByCode = await ensureTags(dataSource, userId);

  const p5Items = buildP5Items();
  const p6Passages = buildP6Passages();
  const p7Passages = buildP7Passages();

  const p5Groups: QuestionGroup[] = [];
  for (let i = 0; i < p5Items.length; i++) {
    const mcq = p5Items[i];
    const g = await saveGroupWithQuestions(dataSource, {
      userId,
      code: `SEED-${suffix}-P5-${String(i + 1).padStart(3, '0')}`,
      title: `P5 Incomplete — ${i + 1}`,
      part: QuestionPart.P5,
      level: levelAt(i),
      stem: null,
      tags: [tagsByCode['grammar:word_form'], tagsByCode['vocab:general']],
      questions: [mcq],
    });
    p5Groups.push(g);
  }

  const p6Groups: QuestionGroup[] = [];
  for (let p = 0; p < p6Passages.length; p++) {
    const passage = p6Passages[p];
    const g = await saveGroupWithQuestions(dataSource, {
      userId,
      code: `SEED-${suffix}-P6-${String(p + 1).padStart(2, '0')}`,
      title: `P6 Text completion — passage ${p + 1}`,
      part: QuestionPart.P6,
      level: levelAt(p + 10),
      stem: passage.stem,
      tags: [tagsByCode['grammar:preposition'], tagsByCode['reading:detail']],
      questions: passage.items,
    });
    p6Groups.push(g);
  }

  const p7Groups: QuestionGroup[] = [];
  for (let p = 0; p < p7Passages.length; p++) {
    const passage = p7Passages[p];
    const g = await saveGroupWithQuestions(dataSource, {
      userId,
      code: `SEED-${suffix}-P7-${String(p + 1).padStart(2, '0')}`,
      title: `P7 Reading — set ${p + 1}`,
      part: QuestionPart.P7,
      level: levelAt(p + 20),
      stem: passage.stem,
      tags: [tagsByCode['reading:detail'], tagsByCode['reading:inference']],
      questions: passage.items,
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
  const existing = await examRepo.findOne({ where: { code: examCode } });
  if (existing) {
    console.warn(
      `Đã tồn tại exam_templates.code=${examCode} — xóa tay hoặc đổi SEED_CODE_SUFFIX rồi chạy lại.`,
    );
    await dataSource.destroy();
    process.exit(1);
  }

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
