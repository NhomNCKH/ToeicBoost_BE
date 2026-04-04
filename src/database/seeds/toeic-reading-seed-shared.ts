import { DataSource } from 'typeorm';
import {
  QuestionLevel,
  QuestionPart,
  QuestionGroupStatus,
} from '../../common/constants/question-bank.enum';
import { User } from '../../modules/security/entities/user.entity';
import { UserStatus } from '../../common/constants/user.enum';
import { Role } from '../../modules/admin/rbac/entities/role.entity';
import { UserRoleAssignment } from '../../modules/admin/rbac/entities/user-role.entity';
import { Tag } from '../../modules/admin/question-bank/entities/tag.entity';
import { QuestionGroup } from '../../modules/admin/question-bank/entities/question-group.entity';
import { Question } from '../../modules/admin/question-bank/entities/question.entity';
import { QuestionOption } from '../../modules/admin/question-bank/entities/question-option.entity';
import { QuestionGroupTag } from '../../modules/admin/question-bank/entities/question-group-tag.entity';
import { optionsWithKey, type McqDef } from './toeic-reading-p567-content';

export const READING_SEED_LEVELS = [
  QuestionLevel.EASY,
  QuestionLevel.MEDIUM,
  QuestionLevel.HARD,
  QuestionLevel.EXPERT,
];

export function readingLevelAt(i: number): QuestionLevel {
  return READING_SEED_LEVELS[i % READING_SEED_LEVELS.length];
}

export async function resolveSeedUserId(ds: DataSource): Promise<string> {
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

export async function ensureReadingSeedTags(
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
        description: 'Auto-created by TOEIC reading seed',
        createdById: userId,
      });
      await repo.save(t);
    }
    out[d.code] = t;
  }
  return out;
}

export async function saveReadingQuestionGroup(
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
    sourceRef: string;
    seedMeta: Record<string, string>;
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
    sourceRef: params.sourceRef,
    publishedAt: new Date(),
    deletedAt: null,
    metadata: params.seedMeta,
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
