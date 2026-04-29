/**
 * Seed ngân hàng câu hỏi Listening P1–P4 (có asset transcript/audio placeholder)
 * + Seed TOEIC Speaking tasks (bảng toeic_speaking_tasks).
 *
 * Chạy (từ thư mục ToeicBoost_BE):
 *   npm run migration:run
 *   npm run seed:toeic-listening-speaking
 *
 * Ghi chú: audio chỉ seed metadata/storageKey placeholder (không upload file).
 */
import * as path from 'path';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { DB_ENTITIES_PATH, getDatabaseConfig } from '../../config/database.config';
import { AssetKind, QuestionGroupStatus, QuestionLevel, QuestionPart } from '../../common/constants/question-bank.enum';
import { QuestionGroup } from '../../modules/admin/question-bank/entities/question-group.entity';
import { QuestionGroupAsset } from '../../modules/admin/question-bank/entities/question-group-asset.entity';
import { Question } from '../../modules/admin/question-bank/entities/question.entity';
import { QuestionOption } from '../../modules/admin/question-bank/entities/question-option.entity';
import { resolveSeedUserId } from './toeic-reading-seed-shared';
import { ToeicSpeakingTask } from '../../modules/admin/skill-tasks/entities/toeic-speaking-task.entity';
import { SkillTaskStatus, ToeicSpeakingTaskType } from '../../common/constants/skill-task.enum';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const SEED_SOURCE_REF = 'run-seed-toeic-listening-speaking';

type SeedMcq = {
  prompt: string;
  options: Array<{ key: string; content: string }>;
  answerKey: string;
  rationale?: string;
};

function buildP1(): Array<{ title: string; transcript: string; items: SeedMcq[] }> {
  return [
    {
      title: 'P1 Photos — Office scene',
      transcript: 'Look at the picture. You will hear four statements.',
      items: [
        {
          prompt: 'Which statement best describes the picture?',
          options: [
            { key: 'A', content: 'A man is carrying a box into an office.' },
            { key: 'B', content: 'A meeting is being held in a conference room.' },
            { key: 'C', content: 'Two people are waiting at a bus stop.' },
            { key: 'D', content: 'A woman is serving food in a restaurant.' },
          ],
          answerKey: 'A',
          rationale: 'The correct choice describes the visible action in the photo.',
        },
      ],
    },
  ];
}

function buildP2(): Array<{ title: string; transcript: string; items: SeedMcq[] }> {
  return [
    {
      title: 'P2 Question–Response — Schedules',
      transcript: 'You will hear a question or statement and three responses.',
      items: [
        {
          prompt: 'When does the next train leave?',
          options: [
            { key: 'A', content: 'At platform four.' },
            { key: 'B', content: 'In about ten minutes.' },
            { key: 'C', content: 'I bought it yesterday.' },
          ],
          answerKey: 'B',
          rationale: 'A time response is appropriate for a schedule question.',
        },
      ],
    },
  ];
}

function buildP3(): Array<{ title: string; transcript: string; items: SeedMcq[] }> {
  return [
    {
      title: 'P3 Conversations — Customer service',
      transcript:
        'You will hear a conversation between two people. Then answer the questions.',
      items: [
        {
          prompt: 'What problem is the customer reporting?',
          options: [
            { key: 'A', content: 'A delayed delivery' },
            { key: 'B', content: 'A billing mistake' },
            { key: 'C', content: 'A missing item' },
            { key: 'D', content: 'A wrong store location' },
          ],
          answerKey: 'C',
        },
        {
          prompt: 'What will the representative do next?',
          options: [
            { key: 'A', content: 'Send a replacement immediately' },
            { key: 'B', content: 'Offer a discount coupon' },
            { key: 'C', content: 'Transfer the call' },
            { key: 'D', content: 'Schedule a store visit' },
          ],
          answerKey: 'A',
        },
      ],
    },
  ];
}

function buildP4(): Array<{ title: string; transcript: string; items: SeedMcq[] }> {
  return [
    {
      title: 'P4 Talks — Company announcement',
      transcript:
        'You will hear a talk given by a single speaker. Then answer the questions.',
      items: [
        {
          prompt: 'What is the announcement mainly about?',
          options: [
            { key: 'A', content: 'A new office opening' },
            { key: 'B', content: 'A staff training session' },
            { key: 'C', content: 'A change in work hours' },
            { key: 'D', content: 'A product recall' },
          ],
          answerKey: 'B',
        },
      ],
    },
  ];
}

async function saveListeningGroup(
  ds: DataSource,
  input: {
    userId: string;
    code: string;
    title: string;
    part: QuestionPart;
    level: QuestionLevel;
    transcript: string;
    items: SeedMcq[];
    audioStorageKey: string;
  },
) {
  const qgRepo = ds.getRepository(QuestionGroup);
  const qRepo = ds.getRepository(Question);
  const optRepo = ds.getRepository(QuestionOption);
  const assetRepo = ds.getRepository(QuestionGroupAsset);

  const group = qgRepo.create({
    code: input.code,
    title: input.title,
    part: input.part,
    level: input.level,
    status: QuestionGroupStatus.PUBLISHED,
    stem: null,
    explanation: null,
    sourceType: 'seed',
    sourceRef: SEED_SOURCE_REF,
    publishedAt: new Date(),
    deletedAt: null,
    metadata: { seed: 'toeic-listening', part: input.part },
    createdById: input.userId,
    updatedById: null,
    reviewedById: null,
  } as any) as unknown as QuestionGroup;
  await qgRepo.save(group);

  await assetRepo.save(
    assetRepo.create({
      questionGroupId: group.id,
      kind: AssetKind.TRANSCRIPT,
      storageKey: `seed/${input.code}/transcript.txt`,
      publicUrl: null,
      mimeType: 'text/plain',
      durationSec: null,
      sortOrder: 0,
      contentText: input.transcript,
      metadata: { seed: true },
    }),
  );

  await assetRepo.save(
    assetRepo.create({
      questionGroupId: group.id,
      kind: AssetKind.AUDIO,
      storageKey: input.audioStorageKey,
      publicUrl: null,
      mimeType: 'audio/mpeg',
      durationSec: null,
      sortOrder: 0,
      contentText: null,
      metadata: { seed: true, note: 'audio placeholder; upload later via Admin presign' },
    }),
  );

  for (let i = 0; i < input.items.length; i++) {
    const it = input.items[i];
    const q = await qRepo.save(
      qRepo.create({
        questionGroupId: group.id,
        questionNo: i + 1,
        prompt: it.prompt,
        answerKey: it.answerKey,
        rationale: it.rationale ?? null,
        timeLimitSec: null,
        scoreWeight: '1',
        metadata: {},
      }),
    );

    for (let o = 0; o < it.options.length; o++) {
      const opt = it.options[o];
      await optRepo.save(
        optRepo.create({
          questionId: q.id,
          optionKey: opt.key,
          content: opt.content,
          isCorrect: opt.key === it.answerKey,
          sortOrder: o,
        }),
      );
    }
  }

  return group;
}

async function main() {
  const suffix = (process.env.SEED_CODE_SUFFIX ?? 'demo').replace(/[^a-zA-Z0-9_-]/g, '');
  const db = getDatabaseConfig();
  const dataSource = new DataSource({
    ...db,
    entities: [DB_ENTITIES_PATH],
  });
  await dataSource.initialize();
  console.log('DB connected.');

  const userId = await resolveSeedUserId(dataSource);

  const qgRepo = dataSource.getRepository(QuestionGroup);
  const speakingRepo = dataSource.getRepository(ToeicSpeakingTask);

  const sampleCode = `SEED-${suffix}-L-P1-001`;
  const speakingCode = `SEED-${suffix}-S-READ-001`;
  const [existsQG, existsSpeak] = await Promise.all([
    qgRepo.findOne({ where: { code: sampleCode } }),
    speakingRepo.findOne({ where: { code: speakingCode } }),
  ]);
  if (existsQG || existsSpeak) {
    console.error('\n--- Seed dừng: trùng mã. Đổi SEED_CODE_SUFFIX và chạy lại. ---');
    console.error('PowerShell: $env:SEED_CODE_SUFFIX="v2"; npm run seed:toeic-listening-speaking');
    await dataSource.destroy();
    process.exit(1);
  }

  // Listening groups
  const p1 = buildP1();
  const p2 = buildP2();
  const p3 = buildP3();
  const p4 = buildP4();

  let countGroups = 0;
  for (let i = 0; i < p1.length; i++) {
    await saveListeningGroup(dataSource, {
      userId,
      code: `SEED-${suffix}-L-P1-${String(i + 1).padStart(3, '0')}`,
      title: p1[i].title,
      part: QuestionPart.P1,
      level: QuestionLevel.EASY,
      transcript: p1[i].transcript,
      items: p1[i].items,
      audioStorageKey: `question-bank/P1/SEED-${suffix}-${i + 1}.mp3`,
    });
    countGroups++;
  }
  for (let i = 0; i < p2.length; i++) {
    await saveListeningGroup(dataSource, {
      userId,
      code: `SEED-${suffix}-L-P2-${String(i + 1).padStart(3, '0')}`,
      title: p2[i].title,
      part: QuestionPart.P2,
      level: QuestionLevel.EASY,
      transcript: p2[i].transcript,
      items: p2[i].items,
      audioStorageKey: `question-bank/P2/SEED-${suffix}-${i + 1}.mp3`,
    });
    countGroups++;
  }
  for (let i = 0; i < p3.length; i++) {
    await saveListeningGroup(dataSource, {
      userId,
      code: `SEED-${suffix}-L-P3-${String(i + 1).padStart(3, '0')}`,
      title: p3[i].title,
      part: QuestionPart.P3,
      level: QuestionLevel.MEDIUM,
      transcript: p3[i].transcript,
      items: p3[i].items,
      audioStorageKey: `question-bank/P3/SEED-${suffix}-${i + 1}.mp3`,
    });
    countGroups++;
  }
  for (let i = 0; i < p4.length; i++) {
    await saveListeningGroup(dataSource, {
      userId,
      code: `SEED-${suffix}-L-P4-${String(i + 1).padStart(3, '0')}`,
      title: p4[i].title,
      part: QuestionPart.P4,
      level: QuestionLevel.MEDIUM,
      transcript: p4[i].transcript,
      items: p4[i].items,
      audioStorageKey: `question-bank/P4/SEED-${suffix}-${i + 1}.mp3`,
    });
    countGroups++;
  }

  // Speaking tasks
  const speakingTasks = [
    speakingRepo.create({
      code: `SEED-${suffix}-S-READ-001`,
      title: 'Part 1 — Read aloud (Office hours)',
      taskType: ToeicSpeakingTaskType.READ_ALOUD,
      level: QuestionLevel.EASY,
      status: SkillTaskStatus.PUBLISHED,
      prompt:
        "Read the following text aloud: 'Thank you for calling our office. Our business hours are from 9 a.m. to 6 p.m., Monday through Friday.'",
      targetSeconds: 45,
      timeLimitSec: 60,
      tips: ['Đọc rõ phụ âm cuối.', 'Ngắt nghỉ theo dấu câu.'],
      rubric: {
        criteria: ['pronunciation', 'fluency', 'intonation'],
      },
      metadata: { seed: true },
      publishedAt: new Date(),
      createdById: userId,
      updatedById: null,
    }),
    speakingRepo.create({
      code: `SEED-${suffix}-S-DESC-001`,
      title: 'Part 2 — Describe a picture (Office)',
      taskType: ToeicSpeakingTaskType.DESCRIBE_PICTURE,
      level: QuestionLevel.MEDIUM,
      status: SkillTaskStatus.PUBLISHED,
      prompt:
        'Describe a picture. Talk about who is in the picture, what they are doing, and where they are. Speak for 30 seconds.',
      targetSeconds: 30,
      timeLimitSec: 45,
      tips: ['Tổng quan → chi tiết.', 'Dùng thì hiện tại tiếp diễn.'],
      rubric: { criteria: ['relevance', 'grammar', 'vocabulary', 'fluency'] },
      metadata: { seed: true },
      publishedAt: new Date(),
      createdById: userId,
      updatedById: null,
    }),
  ];
  await speakingRepo.save(speakingTasks);

  await dataSource.destroy();
  console.log('--- Seed hoàn tất ---');
  console.log(`Listening question groups: ${countGroups}`);
  console.log(`Speaking tasks: ${speakingTasks.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

