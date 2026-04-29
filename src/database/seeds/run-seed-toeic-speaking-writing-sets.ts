/**
 * Seed ngân hàng TOEIC Speaking/Writing tasks + tạo 1 bộ đề mẫu theo format thi thật.
 *
 * Lưu ý: nội dung "phong cách TOEIC", không sao chép đề ETS.
 *
 * Chạy:
 *   npm run seed:toeic-speaking-writing-sets
 * hoặc:
 *   npx ts-node -r tsconfig-paths/register src/database/seeds/run-seed-toeic-speaking-writing-sets.ts
 *
 * .env: DB_* bắt buộc. SEED_CODE_SUFFIX tuỳ chọn (mặc định demo).
 */
import * as path from 'path';
import * as dotenv from 'dotenv';
import { DataSource, In } from 'typeorm';
import { DB_ENTITIES_PATH, getDatabaseConfig } from '../../config/database.config';
import { resolveSeedUserId } from './toeic-reading-seed-shared';
import { QuestionLevel } from '../../common/constants/question-bank.enum';
import { SkillTaskStatus, ToeicSpeakingTaskType, ToeicWritingTaskType } from '../../common/constants/skill-task.enum';
import { ToeicSpeakingTask } from '../../modules/admin/skill-tasks/entities/toeic-speaking-task.entity';
import { ToeicWritingTask } from '../../modules/admin/skill-tasks/entities/toeic-writing-task.entity';
import { ToeicSpeakingSet } from '../../modules/admin/skill-tasks/entities/toeic-speaking-set.entity';
import { ToeicSpeakingSetItem } from '../../modules/admin/skill-tasks/entities/toeic-speaking-set-item.entity';
import { ToeicWritingSet } from '../../modules/admin/skill-tasks/entities/toeic-writing-set.entity';
import { ToeicWritingSetItem } from '../../modules/admin/skill-tasks/entities/toeic-writing-set-item.entity';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

function safeSuffix() {
  return (process.env.SEED_CODE_SUFFIX ?? 'demo').replace(/[^a-zA-Z0-9_-]/g, '');
}

async function main() {
  const suffix = safeSuffix();
  const db = getDatabaseConfig();
  if (!db.password || typeof db.password !== 'string') {
    throw new Error('DB_PASSWORD không hợp lệ — kiểm tra .env');
  }

  const ds = new DataSource({
    ...db,
    entities: [DB_ENTITIES_PATH],
  });
  await ds.initialize();
  console.log('DB connected.');

  const userId = await resolveSeedUserId(ds);

  const speakRepo = ds.getRepository(ToeicSpeakingTask);
  const writeRepo = ds.getRepository(ToeicWritingTask);
  const speakSetRepo = ds.getRepository(ToeicSpeakingSet);
  const speakItemRepo = ds.getRepository(ToeicSpeakingSetItem);
  const writeSetRepo = ds.getRepository(ToeicWritingSet);
  const writeItemRepo = ds.getRepository(ToeicWritingSetItem);

  const speakingCodes = {
    ra1: `SEED-${suffix}-SP-RA-01`,
    ra2: `SEED-${suffix}-SP-RA-02`,
    pic: `SEED-${suffix}-SP-PIC-01`,
    rq1: `SEED-${suffix}-SP-RQ-01`,
    rq2: `SEED-${suffix}-SP-RQ-02`,
    rq3: `SEED-${suffix}-SP-RQ-03`,
    info1: `SEED-${suffix}-SP-INFO-01`,
    info2: `SEED-${suffix}-SP-INFO-02`,
    info3: `SEED-${suffix}-SP-INFO-03`,
    op: `SEED-${suffix}-SP-OP-01`,
    q: `SEED-${suffix}-SP-Q-01`,
  };

  const writingCodes = {
    s1: `SEED-${suffix}-WR-SENT-01`,
    s2: `SEED-${suffix}-WR-SENT-02`,
    s3: `SEED-${suffix}-WR-SENT-03`,
    s4: `SEED-${suffix}-WR-SENT-04`,
    s5: `SEED-${suffix}-WR-SENT-05`,
    e1: `SEED-${suffix}-WR-EMAIL-01`,
    e2: `SEED-${suffix}-WR-EMAIL-02`,
    es: `SEED-${suffix}-WR-ESSAY-01`,
  };

  // ---- Seed Speaking tasks (11 tasks) ----
  const existingSpeaking = await speakRepo.find({
    where: { code: In(Object.values(speakingCodes)) },
  });
  const existingSpeakCodes = new Set(existingSpeaking.map((t) => t.code));

  const speakingToCreate: Partial<ToeicSpeakingTask>[] = [
    {
      code: speakingCodes.ra1,
      title: 'Part 1 — Read aloud (Company policy)',
      taskType: ToeicSpeakingTaskType.READ_ALOUD,
      level: QuestionLevel.EASY,
      status: SkillTaskStatus.PUBLISHED,
      prompt:
        'Read the text aloud.\n\nEmployees should submit travel requests at least seven days in advance. Please include your preferred flight times and hotel options in the request form. If you need assistance, contact the administrative office.',
      targetSeconds: 45,
      timeLimitSec: 45,
      tips: ['Pronounce final consonants clearly.', 'Pause briefly at punctuation.'],
      rubric: { fluency: 0.35, pronunciation: 0.35, intonation: 0.3 },
      metadata: { seed: true, prepTimeSec: 45, responseTimeSec: 45 },
      createdById: userId,
    },
    {
      code: speakingCodes.ra2,
      title: 'Part 1 — Read aloud (Office announcement)',
      taskType: ToeicSpeakingTaskType.READ_ALOUD,
      level: QuestionLevel.EASY,
      status: SkillTaskStatus.PUBLISHED,
      prompt:
        'Read the text aloud.\n\nThe office will undergo maintenance this weekend. Please remove personal items from your desk by Friday evening. Workstations on the third floor will be unavailable on Saturday.',
      targetSeconds: 45,
      timeLimitSec: 45,
      tips: ['Keep a steady pace.', 'Stress key words such as dates and places.'],
      rubric: { fluency: 0.35, pronunciation: 0.35, intonation: 0.3 },
      metadata: { seed: true, prepTimeSec: 45, responseTimeSec: 45 },
      createdById: userId,
    },
    {
      code: speakingCodes.pic,
      title: 'Part 2 — Describe a picture (Office scene)',
      taskType: ToeicSpeakingTaskType.DESCRIBE_PICTURE,
      level: QuestionLevel.MEDIUM,
      status: SkillTaskStatus.PUBLISHED,
      prompt:
        'Describe the picture.\n\nYou may talk about what is happening, where the scene is taking place, and what the people are doing.',
      targetSeconds: 30,
      timeLimitSec: 30,
      tips: ['Start with the overall scene.', 'Mention at least 3 details.'],
      rubric: { relevance: 0.4, grammar: 0.3, vocabulary: 0.3 },
      metadata: { seed: true, prepTimeSec: 45, responseTimeSec: 30, assetHint: 'image_placeholder' },
      createdById: userId,
    },
    // Respond to questions (3)
    {
      code: speakingCodes.rq1,
      title: 'Part 3 — Respond to questions (Daily routine) — Q1',
      taskType: ToeicSpeakingTaskType.RESPOND_TO_QUESTIONS,
      level: QuestionLevel.EASY,
      status: SkillTaskStatus.PUBLISHED,
      prompt: 'What time do you usually start work or school?',
      targetSeconds: 15,
      timeLimitSec: 15,
      tips: ['Answer directly, then add one detail.'],
      rubric: { relevance: 0.4, clarity: 0.3, grammar: 0.3 },
      metadata: { seed: true, prepTimeSec: 15, responseTimeSec: 15 },
      createdById: userId,
    },
    {
      code: speakingCodes.rq2,
      title: 'Part 3 — Respond to questions (Daily routine) — Q2',
      taskType: ToeicSpeakingTaskType.RESPOND_TO_QUESTIONS,
      level: QuestionLevel.EASY,
      status: SkillTaskStatus.PUBLISHED,
      prompt: 'How do you usually commute to your workplace or school?',
      targetSeconds: 15,
      timeLimitSec: 15,
      tips: ['Use 1–2 complete sentences.'],
      rubric: { relevance: 0.4, clarity: 0.3, grammar: 0.3 },
      metadata: { seed: true, prepTimeSec: 15, responseTimeSec: 15 },
      createdById: userId,
    },
    {
      code: speakingCodes.rq3,
      title: 'Part 3 — Respond to questions (Daily routine) — Q3',
      taskType: ToeicSpeakingTaskType.RESPOND_TO_QUESTIONS,
      level: QuestionLevel.MEDIUM,
      status: SkillTaskStatus.PUBLISHED,
      prompt: 'What do you like most about your job or studies?',
      targetSeconds: 15,
      timeLimitSec: 15,
      tips: ['Give a reason and an example.'],
      rubric: { relevance: 0.4, vocabulary: 0.3, grammar: 0.3 },
      metadata: { seed: true, prepTimeSec: 15, responseTimeSec: 15 },
      createdById: userId,
    },
    // Respond using info (3)
    {
      code: speakingCodes.info1,
      title: 'Part 4 — Respond using info (Schedule) — Q1',
      taskType: ToeicSpeakingTaskType.RESPOND_USING_INFO,
      level: QuestionLevel.MEDIUM,
      status: SkillTaskStatus.PUBLISHED,
      prompt:
        'Using the information provided, answer the question.\n\n(Info) Training Sessions:\n- Tue 10:00–11:30 Room A\n- Wed 14:00–15:30 Room B\n- Fri 09:00–10:30 Room A\n\nQuestion: Which session would you recommend to someone who is only free in the morning?',
      targetSeconds: 15,
      timeLimitSec: 15,
      tips: ['Mention the session day and time.'],
      rubric: { accuracy: 0.45, clarity: 0.25, grammar: 0.3 },
      metadata: { seed: true, prepTimeSec: 30, responseTimeSec: 15 },
      createdById: userId,
    },
    {
      code: speakingCodes.info2,
      title: 'Part 4 — Respond using info (Schedule) — Q2',
      taskType: ToeicSpeakingTaskType.RESPOND_USING_INFO,
      level: QuestionLevel.MEDIUM,
      status: SkillTaskStatus.PUBLISHED,
      prompt:
        'Using the information provided, answer the question.\n\n(Info) Training Sessions:\n- Tue 10:00–11:30 Room A\n- Wed 14:00–15:30 Room B\n- Fri 09:00–10:30 Room A\n\nQuestion: Where will the Wednesday session take place?',
      targetSeconds: 15,
      timeLimitSec: 15,
      tips: ['Answer in one clear sentence.'],
      rubric: { accuracy: 0.45, clarity: 0.25, grammar: 0.3 },
      metadata: { seed: true, prepTimeSec: 30, responseTimeSec: 15 },
      createdById: userId,
    },
    {
      code: speakingCodes.info3,
      title: 'Part 4 — Respond using info (Schedule) — Q3',
      taskType: ToeicSpeakingTaskType.RESPOND_USING_INFO,
      level: QuestionLevel.MEDIUM,
      status: SkillTaskStatus.PUBLISHED,
      prompt:
        'Using the information provided, answer the question.\n\n(Info) Training Sessions:\n- Tue 10:00–11:30 Room A\n- Wed 14:00–15:30 Room B\n- Fri 09:00–10:30 Room A\n\nQuestion: If someone prefers Room A, which days can they attend?',
      targetSeconds: 15,
      timeLimitSec: 15,
      tips: ['List both days.'],
      rubric: { accuracy: 0.45, clarity: 0.25, grammar: 0.3 },
      metadata: { seed: true, prepTimeSec: 30, responseTimeSec: 15 },
      createdById: userId,
    },
    // Express opinion (1)
    {
      code: speakingCodes.op,
      title: 'Part 5 — Express an opinion (Remote work)',
      taskType: ToeicSpeakingTaskType.EXPRESS_OPINION,
      level: QuestionLevel.HARD,
      status: SkillTaskStatus.PUBLISHED,
      prompt:
        'Do you think employees should be allowed to work from home at least one day per week? Explain your opinion with reasons and examples.',
      targetSeconds: 60,
      timeLimitSec: 60,
      tips: ['State your opinion clearly.', 'Give 2 reasons with examples.'],
      rubric: { organization: 0.35, vocabulary: 0.35, grammar: 0.3 },
      metadata: { seed: true, prepTimeSec: 15, responseTimeSec: 60 },
      createdById: userId,
    },
    // Respond to a question (1)
    {
      code: speakingCodes.q,
      title: 'Part 6 — Respond to a question (Customer complaint)',
      taskType: ToeicSpeakingTaskType.RESPOND_TO_QUESTION,
      level: QuestionLevel.MEDIUM,
      status: SkillTaskStatus.PUBLISHED,
      prompt:
        'A customer says that a product arrived damaged. What would you say to the customer?',
      targetSeconds: 30,
      timeLimitSec: 30,
      tips: ['Apologize and offer a solution.'],
      rubric: { relevance: 0.4, tone: 0.3, clarity: 0.3 },
      metadata: { seed: true, prepTimeSec: 15, responseTimeSec: 30 },
      createdById: userId,
    },
  ];

  const speakingCreated = speakingToCreate.filter((x) => !existingSpeakCodes.has(x.code!));
  if (speakingCreated.length) {
    await speakRepo.save(speakingCreated.map((x) => speakRepo.create(x as any) as any));
    console.log(`Created ${speakingCreated.length} speaking tasks.`);
  } else {
    console.log('Speaking tasks already seeded.');
  }

  // ---- Seed Writing tasks (8 tasks) ----
  const existingWriting = await writeRepo.find({
    where: { code: In(Object.values(writingCodes)) },
  });
  const existingWriteCodes = new Set(existingWriting.map((t) => t.code));

  const writingToCreate: Partial<ToeicWritingTask>[] = [
    // Part 1 (5)
    {
      code: writingCodes.s1,
      title: 'Part 1 — Sentence (Office equipment)',
      taskType: ToeicWritingTaskType.PART1_SENTENCE,
      level: QuestionLevel.EASY,
      status: SkillTaskStatus.PUBLISHED,
      prompt:
        'Write ONE sentence based on the picture.\nUse the two words below in your sentence.\n\nWords: printer / repair',
      minWords: null,
      maxWords: null,
      timeLimitSec: 8 * 60,
      tips: ['Use both words exactly as given.', 'Write a grammatically correct sentence.'],
      rubric: { grammar: 0.5, relevance: 0.5 },
      metadata: { seed: true, assetHint: 'image_placeholder', requiredWords: ['printer', 'repair'] },
      createdById: userId,
    },
    {
      code: writingCodes.s2,
      title: 'Part 1 — Sentence (Meeting)',
      taskType: ToeicWritingTaskType.PART1_SENTENCE,
      level: QuestionLevel.EASY,
      status: SkillTaskStatus.PUBLISHED,
      prompt:
        'Write ONE sentence based on the picture.\nUse the two words below in your sentence.\n\nWords: meeting / schedule',
      timeLimitSec: 8 * 60,
      tips: ['Make the meaning clear and natural.'],
      rubric: { grammar: 0.5, relevance: 0.5 },
      metadata: { seed: true, assetHint: 'image_placeholder', requiredWords: ['meeting', 'schedule'] },
      createdById: userId,
    },
    {
      code: writingCodes.s3,
      title: 'Part 1 — Sentence (Delivery)',
      taskType: ToeicWritingTaskType.PART1_SENTENCE,
      level: QuestionLevel.MEDIUM,
      status: SkillTaskStatus.PUBLISHED,
      prompt:
        'Write ONE sentence based on the picture.\nUse the two words below in your sentence.\n\nWords: package / deliver',
      timeLimitSec: 8 * 60,
      tips: ['Use correct tense.', 'Keep it one sentence.'],
      rubric: { grammar: 0.5, relevance: 0.5 },
      metadata: { seed: true, assetHint: 'image_placeholder', requiredWords: ['package', 'deliver'] },
      createdById: userId,
    },
    {
      code: writingCodes.s4,
      title: 'Part 1 — Sentence (Restaurant)',
      taskType: ToeicWritingTaskType.PART1_SENTENCE,
      level: QuestionLevel.MEDIUM,
      status: SkillTaskStatus.PUBLISHED,
      prompt:
        'Write ONE sentence based on the picture.\nUse the two words below in your sentence.\n\nWords: customer / order',
      timeLimitSec: 8 * 60,
      tips: ['Be specific about the action.'],
      rubric: { grammar: 0.5, relevance: 0.5 },
      metadata: { seed: true, assetHint: 'image_placeholder', requiredWords: ['customer', 'order'] },
      createdById: userId,
    },
    {
      code: writingCodes.s5,
      title: 'Part 1 — Sentence (Airport)',
      taskType: ToeicWritingTaskType.PART1_SENTENCE,
      level: QuestionLevel.MEDIUM,
      status: SkillTaskStatus.PUBLISHED,
      prompt:
        'Write ONE sentence based on the picture.\nUse the two words below in your sentence.\n\nWords: flight / delay',
      timeLimitSec: 8 * 60,
      tips: ['Use a natural collocation like “flight delay”.'],
      rubric: { grammar: 0.5, relevance: 0.5 },
      metadata: { seed: true, assetHint: 'image_placeholder', requiredWords: ['flight', 'delay'] },
      createdById: userId,
    },
    // Part 2 (2 emails)
    {
      code: writingCodes.e1,
      title: 'Part 2 — Email (Request for information)',
      taskType: ToeicWritingTaskType.PART2_EMAIL,
      level: QuestionLevel.MEDIUM,
      status: SkillTaskStatus.PUBLISHED,
      prompt:
        'You received the following email.\n\nFrom: Daniel Kim <dkim@northpark.com>\nSubject: Meeting room reservation\n\nHello,\nCould you reserve a meeting room for next Tuesday afternoon? We need a projector and seating for eight people.\n\nThanks,\nDaniel\n\nIn your response, be sure to:\n- confirm the reservation details\n- mention the equipment\n- ask one follow-up question',
      minWords: 70,
      maxWords: 120,
      timeLimitSec: 10 * 60,
      tips: ['Use a polite, business tone.', 'Answer all bullet points.'],
      rubric: { completeness: 0.4, grammar: 0.3, tone: 0.3 },
      metadata: { seed: true, bullets: 3 },
      createdById: userId,
    },
    {
      code: writingCodes.e2,
      title: 'Part 2 — Email (Customer service)',
      taskType: ToeicWritingTaskType.PART2_EMAIL,
      level: QuestionLevel.MEDIUM,
      status: SkillTaskStatus.PUBLISHED,
      prompt:
        'You received the following email.\n\nFrom: Sofia Lee <sofia.lee@clientmail.com>\nSubject: Invoice question\n\nHi,\nI think I was charged twice for my last order. Could you check and let me know what happened?\n\nSincerely,\nSofia\n\nIn your response, be sure to:\n- apologize for the inconvenience\n- explain what you will check\n- state when you will follow up',
      minWords: 70,
      maxWords: 120,
      timeLimitSec: 10 * 60,
      tips: ['Be clear about next steps.', 'Give a realistic timeline.'],
      rubric: { completeness: 0.4, clarity: 0.3, tone: 0.3 },
      metadata: { seed: true, bullets: 3 },
      createdById: userId,
    },
    // Part 3 (1 essay)
    {
      code: writingCodes.es,
      title: 'Part 3 — Essay (Training programs)',
      taskType: ToeicWritingTaskType.PART3_ESSAY,
      level: QuestionLevel.HARD,
      status: SkillTaskStatus.PUBLISHED,
      prompt:
        'Some companies require employees to attend training programs every year. Do you think this is a good idea? Use specific reasons and examples to support your opinion.',
      minWords: 250,
      maxWords: 400,
      timeLimitSec: 30 * 60,
      tips: ['Write an introduction, 2 body paragraphs, and a conclusion.', 'Use examples from work situations.'],
      rubric: { organization: 0.35, grammar: 0.35, vocabulary: 0.3 },
      metadata: { seed: true },
      createdById: userId,
    },
  ];

  const writingCreated = writingToCreate.filter((x) => !existingWriteCodes.has(x.code!));
  if (writingCreated.length) {
    await writeRepo.save(writingCreated.map((x) => writeRepo.create(x as any) as any));
    console.log(`Created ${writingCreated.length} writing tasks.`);
  } else {
    console.log('Writing tasks already seeded.');
  }

  // ---- Create sample sets ----
  const speakingSetCode = `SEED-${suffix}-SP-SET-01`;
  const writingSetCode = `SEED-${suffix}-WR-SET-01`;

  const [existingSpeakSet, existingWriteSet] = await Promise.all([
    speakSetRepo.findOne({ where: { code: speakingSetCode } }),
    writeSetRepo.findOne({ where: { code: writingSetCode } }),
  ]);

  if (!existingSpeakSet) {
    const set = await speakSetRepo.save(
      speakSetRepo.create({
        code: speakingSetCode,
        title: `Bộ đề TOEIC Speaking — Seed (${suffix})`,
        level: QuestionLevel.MEDIUM,
        status: SkillTaskStatus.DRAFT,
        timeLimitSec: 20 * 60,
        metadata: { seed: true, format: 'toeic-speaking-11q' },
        publishedAt: null,
        createdById: userId,
        updatedById: null,
      } as any) as any,
    );

    const tasks = await speakRepo.find({ where: { code: In(Object.values(speakingCodes)) } });
    const byCode = new Map(tasks.map((t) => [t.code, t]));
    const orderCodes = [
      speakingCodes.ra1,
      speakingCodes.ra2,
      speakingCodes.pic,
      speakingCodes.rq1,
      speakingCodes.rq2,
      speakingCodes.rq3,
      speakingCodes.info1,
      speakingCodes.info2,
      speakingCodes.info3,
      speakingCodes.op,
      speakingCodes.q,
    ];

    let order = 0;
    const speakingItems = orderCodes.map((c) => {
      order += 1;
      const t = byCode.get(c)!;
      return speakItemRepo.create({
        setId: (set as any).id,
        taskId: t.id,
        taskType: t.taskType,
        sortOrder: order,
        createdById: userId,
      } as any) as any;
    });
    await speakItemRepo.save(speakingItems as any);
    console.log('Created speaking set + items.');
  } else {
    console.log('Speaking set already exists.');
  }

  if (!existingWriteSet) {
    const set = await writeSetRepo.save(
      writeSetRepo.create({
        code: writingSetCode,
        title: `Bộ đề TOEIC Writing — Seed (${suffix})`,
        level: QuestionLevel.MEDIUM,
        status: SkillTaskStatus.DRAFT,
        timeLimitSec: 60 * 60,
        metadata: { seed: true, format: 'toeic-writing-8q' },
        publishedAt: null,
        createdById: userId,
        updatedById: null,
      } as any) as any,
    );

    const tasks = await writeRepo.find({ where: { code: In(Object.values(writingCodes)) } });
    const byCode = new Map(tasks.map((t) => [t.code, t]));
    const orderCodes = [
      writingCodes.s1,
      writingCodes.s2,
      writingCodes.s3,
      writingCodes.s4,
      writingCodes.s5,
      writingCodes.e1,
      writingCodes.e2,
      writingCodes.es,
    ];

    let order = 0;
    const writingItems = orderCodes.map((c) => {
      order += 1;
      const t = byCode.get(c)!;
      return writeItemRepo.create({
        setId: (set as any).id,
        taskId: t.id,
        taskType: t.taskType,
        sortOrder: order,
        createdById: userId,
      } as any) as any;
    });
    await writeItemRepo.save(writingItems as any);
    console.log('Created writing set + items.');
  } else {
    console.log('Writing set already exists.');
  }

  await ds.destroy();
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

