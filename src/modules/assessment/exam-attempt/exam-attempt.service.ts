import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { APP_CONSTANTS } from '@common/constants/app.constant';
import { ExamAttemptStatus } from '@common/constants/assessment.enum';
import { TemplateStatus } from '@common/constants/exam-template.enum';
import { QuestionPart } from '@common/constants/question-bank.enum';
import { CredentialRequest } from '@modules/admin/credential/entities/credential-request.entity';
import { ExamTemplate } from '@modules/admin/exam-template/entities/exam-template.entity';
import {
  LearnerExamAttemptHistoryQueryDto,
  LearnerExamTemplateQueryDto,
  SaveExamAttemptAnswersDto,
  StartExamAttemptDto,
  SubmitExamAttemptDto,
} from './dto/exam-attempt.dto';
import { ExamAttemptAnswer } from './entities/exam-attempt-answer.entity';
import { ExamAttemptPartScore } from './entities/exam-attempt-part-score.entity';
import { ExamAttempt } from './entities/exam-attempt.entity';
import { CredentialEligibilityService } from './credential-eligibility.service';

type ToeicDomain = 'listening' | 'reading';

const TOEIC_LISTENING_SCORE_TABLE = [
  5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 10, 15, 20, 25, 30, 35,
  40, 45, 50, 55, 60, 70, 80, 85, 90, 95, 100, 105, 115, 125, 135, 140, 150,
  160, 170, 175, 180, 190, 200, 205, 215, 220, 225, 230, 235, 245, 255, 260,
  265, 275, 285, 290, 295, 300, 310, 320, 325, 330, 335, 340, 345, 350, 355,
  360, 365, 370, 375, 385, 395, 400, 405, 415, 420, 425, 430, 435, 440, 445,
  455, 460, 465, 475, 480, 485, 490, 495, 495, 495, 495, 495, 495, 495, 495,
] as const;

const TOEIC_READING_SCORE_TABLE = [
  5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 10, 15, 20,
  25, 30, 35, 40, 45, 55, 60, 65, 70, 75, 80, 85, 90, 95, 105, 115, 120, 125,
  130, 135, 140, 145, 155, 160, 170, 175, 185, 195, 205, 210, 215, 220, 230,
  240, 245, 250, 255, 260, 270, 275, 280, 285, 290, 295, 295, 300, 310, 315,
  320, 325, 330, 335, 340, 345, 355, 360, 370, 375, 385, 390, 395, 405, 415,
  420, 425, 435, 440, 450, 455, 460, 470, 475, 485, 485, 490, 495,
] as const;

interface AttemptOptionSnapshot {
  optionKey: string;
  content: string;
  sortOrder: number;
  isCorrect: boolean;
}

interface AttemptQuestionSnapshot {
  id: string;
  questionNo: number;
  prompt: string;
  answerKey: string;
  rationale: string | null;
  timeLimitSec: number | null;
  scoreWeight: number;
  metadata: Record<string, unknown>;
  options: AttemptOptionSnapshot[];
}

interface AttemptAssetSnapshot {
  id: string;
  kind: string;
  storageKey: string | null;
  publicUrl: string | null;
  mimeType: string | null;
  durationSec: number | null;
  sortOrder: number;
  contentText: string | null;
  metadata: Record<string, unknown>;
}

interface AttemptGroupSnapshot {
  id: string;
  code: string;
  title: string;
  part: QuestionPart;
  level: string;
  stem: string | null;
  explanation: string | null;
  assets: AttemptAssetSnapshot[];
  questions: AttemptQuestionSnapshot[];
}

interface AttemptItemSnapshot {
  id: string;
  questionGroupId: string;
  displayOrder: number;
  sourceMode: string;
  locked: boolean;
  questionGroup: AttemptGroupSnapshot;
}

interface AttemptSectionSnapshot {
  id: string;
  part: QuestionPart;
  sectionOrder: number;
  expectedGroupCount: number;
  expectedQuestionCount: number;
  durationSec: number | null;
  instructions: string | null;
  items: AttemptItemSnapshot[];
}

interface AttemptTemplateSnapshot {
  template: {
    id: string;
    code: string;
    name: string;
    mode: string;
    totalDurationSec: number;
    totalQuestions: number;
    instructions: string | null;
    shuffleQuestionOrder: boolean;
    shuffleOptionOrder: boolean;
  };
  sections: AttemptSectionSnapshot[];
}

interface SnapshotQuestionContext {
  section: AttemptSectionSnapshot;
  item: AttemptItemSnapshot;
  question: AttemptQuestionSnapshot;
}

interface AttemptPartScoreComputation {
  sectionOrder: number;
  questionCount: number;
  correctCount: number;
  rawScore: number;
  scaledScore: number;
  durationSec: number;
}

interface AttemptScoreComputation {
  answeredCount: number;
  correctCount: number;
  listeningCorrectCount: number;
  readingCorrectCount: number;
  listeningQuestionCount: number;
  readingQuestionCount: number;
  listeningRawScore: number;
  readingRawScore: number;
  listeningScaledScore: number;
  readingScaledScore: number;
  totalScore: number;
  partStats: Map<QuestionPart, AttemptPartScoreComputation>;
}

@Injectable()
export class ExamAttemptService {
  constructor(
    @InjectRepository(ExamAttempt)
    private readonly examAttemptRepository: Repository<ExamAttempt>,
    @InjectRepository(ExamAttemptAnswer)
    private readonly examAttemptAnswerRepository: Repository<ExamAttemptAnswer>,
    @InjectRepository(ExamAttemptPartScore)
    private readonly examAttemptPartScoreRepository: Repository<ExamAttemptPartScore>,
    @InjectRepository(ExamTemplate)
    private readonly examTemplateRepository: Repository<ExamTemplate>,
    @InjectRepository(CredentialRequest)
    private readonly credentialRequestRepository: Repository<CredentialRequest>,
    private readonly credentialEligibilityService: CredentialEligibilityService,
    private readonly dataSource: DataSource,
  ) {}

  async listPublishedTemplates(query: LearnerExamTemplateQueryDto) {
    const qb = this.examTemplateRepository
      .createQueryBuilder('tpl')
      .where('tpl.status = :status', { status: TemplateStatus.PUBLISHED });

    if (query.mode) {
      qb.andWhere('tpl.mode = :mode', { mode: query.mode });
    }

    if (query.keyword?.trim()) {
      qb.andWhere('(tpl.code ILIKE :keyword OR tpl.name ILIKE :keyword)', {
        keyword: `%${query.keyword.trim()}%`,
      });
    }

    qb.select([
      'tpl.id',
      'tpl.code',
      'tpl.name',
      'tpl.mode',
      'tpl.status',
      'tpl.totalDurationSec',
      'tpl.totalQuestions',
      'tpl.instructions',
      'tpl.metadata',
      'tpl.publishedAt',
      'tpl.createdAt',
      'tpl.updatedAt',
    ]);

    return qb
      .orderBy('tpl.publishedAt', 'DESC')
      .addOrderBy('tpl.updatedAt', 'DESC')
      .addOrderBy('tpl.createdAt', 'DESC')
      .skip(((query.page ?? 1) - 1) * (query.limit ?? 20))
      .take(query.limit ?? 20)
      .getManyAndCount()
      .then(([data, total]) => ({
        data,
        pagination: {
          page: query.page ?? 1,
          limit: query.limit ?? 20,
          total,
          totalPages: Math.max(
            1,
            Math.ceil(total / Math.max(query.limit ?? 20, 1)),
          ),
        },
      }));
  }

  async listAttemptHistory(
    query: LearnerExamAttemptHistoryQueryDto,
    userId: string,
  ) {
    const qb = this.examAttemptRepository
      .createQueryBuilder('attempt')
      .innerJoin('attempt.examTemplate', 'template')
      .where('attempt.userId = :userId', { userId });

    if (query.examTemplateId) {
      qb.andWhere('attempt.examTemplateId = :examTemplateId', {
        examTemplateId: query.examTemplateId,
      });
    }

    if (query.status) {
      qb.andWhere('attempt.status = :status', { status: query.status });
    }

    qb.select([
      'attempt.id',
      'attempt.examTemplateId',
      'attempt.attemptNo',
      'attempt.status',
      'attempt.startedAt',
      'attempt.submittedAt',
      'attempt.gradedAt',
      'attempt.durationSec',
      'attempt.totalQuestions',
      'attempt.answeredCount',
      'attempt.correctCount',
      'attempt.listeningScaledScore',
      'attempt.readingScaledScore',
      'attempt.totalScore',
      'attempt.passed',
      'template.id',
      'template.code',
      'template.name',
      'template.mode',
      'template.totalDurationSec',
    ]);

    return qb
      .orderBy('attempt.submittedAt', 'DESC', 'NULLS LAST')
      .addOrderBy('attempt.startedAt', 'DESC')
      .skip(((query.page ?? 1) - 1) * (query.limit ?? 20))
      .take(query.limit ?? 20)
      .getManyAndCount()
      .then(([data, total]) => ({
        data: data.map((attempt) => ({
          id: attempt.id,
          examTemplateId: attempt.examTemplateId,
          attemptNo: attempt.attemptNo,
          status: attempt.status,
          startedAt: attempt.startedAt,
          submittedAt: attempt.submittedAt,
          gradedAt: attempt.gradedAt,
          durationSec: attempt.durationSec,
          totalQuestions: attempt.totalQuestions,
          answeredCount: attempt.answeredCount,
          correctCount: attempt.correctCount,
          listeningScaledScore: Number(attempt.listeningScaledScore),
          readingScaledScore: Number(attempt.readingScaledScore),
          totalScore: Number(attempt.totalScore),
          passed: attempt.passed,
          template: attempt.examTemplate
            ? {
                id: attempt.examTemplate.id,
                code: attempt.examTemplate.code,
                name: attempt.examTemplate.name,
                mode: attempt.examTemplate.mode,
                totalDurationSec: attempt.examTemplate.totalDurationSec,
              }
            : null,
        })),
        pagination: {
          page: query.page ?? 1,
          limit: query.limit ?? 20,
          total,
          totalPages: Math.max(
            1,
            Math.ceil(total / Math.max(query.limit ?? 20, 1)),
          ),
        },
      }));
  }

  async startAttempt(dto: StartExamAttemptDto, userId: string) {
    const existingAttempt = await this.examAttemptRepository.findOne({
      where: {
        userId,
        examTemplateId: dto.examTemplateId,
        status: ExamAttemptStatus.IN_PROGRESS,
      },
      order: { createdAt: 'DESC' },
    });

    if (existingAttempt) {
      const shouldCloseExistingAttempt =
        dto.forceNew || this.isAttemptExpired(existingAttempt);

      if (!shouldCloseExistingAttempt) {
        return this.getAttemptSession(existingAttempt.id, userId, true);
      }

      await this.submitAttempt(
        existingAttempt.id,
        {
          metadata: {
            source: dto.forceNew ? 'force-new-start' : 'auto-expire-on-start',
          },
        },
        userId,
      );
    }

    const template = await this.loadPublishedTemplate(dto.examTemplateId);
    const snapshot = this.buildTemplateSnapshot(template);
    const totalQuestions = this.countSnapshotQuestions(snapshot);

    if (totalQuestions === 0) {
      throw new BadRequestException('Mau de thi khong co cau hoi de bat dau');
    }

    const lastAttempt = await this.examAttemptRepository.findOne({
      where: { userId, examTemplateId: dto.examTemplateId },
      order: { attemptNo: 'DESC' },
    });

    const attempt = this.examAttemptRepository.create({
      createdById: userId,
      userId,
      examTemplateId: template.id,
      attemptNo: (lastAttempt?.attemptNo ?? 0) + 1,
      status: ExamAttemptStatus.IN_PROGRESS,
      mode: template.mode,
      startedAt: new Date(),
      totalQuestions,
      passThresholdSnapshot: APP_CONSTANTS.CERTIFICATE_PASS_THRESHOLD,
      scoringVersion: APP_CONSTANTS.EXAM_SCORING_VERSION,
      templateSnapshot: snapshot as unknown as Record<string, unknown>,
      metadata: dto.metadata ?? {},
    });

    const savedAttempt = await this.examAttemptRepository.save(attempt);
    return this.getAttemptSession(savedAttempt.id, userId, false);
  }

  async saveAnswers(
    attemptId: string,
    dto: SaveExamAttemptAnswersDto,
    userId: string,
  ) {
    this.ensureUniqueQuestionIds(dto.answers.map((item) => item.questionId));

    return this.dataSource.transaction(async (manager) => {
      const attempt = await manager
        .getRepository(ExamAttempt)
        .createQueryBuilder('attempt')
        .setLock('pessimistic_write')
        .where('attempt.id = :attemptId', { attemptId })
        .andWhere('attempt.userId = :userId', { userId })
        .getOne();

      if (!attempt) {
        throw new NotFoundException('Khong tim thay phien lam bai');
      }

      if (attempt.status !== ExamAttemptStatus.IN_PROGRESS) {
        throw new BadRequestException(
          'Chi duoc luu dap an khi bai thi dang mo',
        );
      }

      const snapshot = this.getSnapshot(attempt);
      const questionIndex = this.buildSnapshotQuestionIndex(snapshot);
      const inputQuestionIds = dto.answers.map((item) => item.questionId);
      const existingAnswers =
        inputQuestionIds.length > 0
          ? await manager.getRepository(ExamAttemptAnswer).find({
              where: {
                examAttemptId: attempt.id,
                questionId: In(inputQuestionIds),
              },
            })
          : [];
      const existingMap = new Map(
        existingAnswers.map((answer) => [answer.questionId, answer]),
      );
      let answeredCount =
        typeof attempt.answeredCount === 'number'
          ? attempt.answeredCount
          : await manager.getRepository(ExamAttemptAnswer).count({
              where: { examAttemptId: attempt.id },
            });

      const toSave: ExamAttemptAnswer[] = [];
      const toDeleteIds: string[] = [];

      for (const input of dto.answers) {
        const questionContext = questionIndex.get(input.questionId);
        if (!questionContext) {
          throw new BadRequestException(
            `Cau hoi khong thuoc phien lam bai: ${input.questionId}`,
          );
        }

        const selectedOption = this.resolveSelectedOption(
          questionContext.question,
          input.selectedOptionKey,
        );

        const existing = existingMap.get(input.questionId);
        if (!selectedOption) {
          if (existing) {
            toDeleteIds.push(existing.id);
            answeredCount = Math.max(answeredCount - 1, 0);
          }
          continue;
        }

        if (!existing) {
          answeredCount += 1;
        }

        const answerEntity =
          existing ??
          manager.getRepository(ExamAttemptAnswer).create({
            createdById: userId,
            examAttemptId: attempt.id,
            questionGroupId: questionContext.item.questionGroupId,
            questionId: questionContext.question.id,
            part: questionContext.section.part,
            questionNo: questionContext.question.questionNo,
          });

        answerEntity.selectedOptionKey = selectedOption.optionKey;
        answerEntity.selectedOptionSnapshot = {
          optionKey: selectedOption.optionKey,
          content: selectedOption.content,
          sortOrder: selectedOption.sortOrder,
        };
        answerEntity.answeredAt = input.answeredAt
          ? new Date(input.answeredAt)
          : new Date();
        answerEntity.timeSpentSec =
          typeof input.timeSpentSec === 'number' ? input.timeSpentSec : null;
        answerEntity.answerPayload = input.answerPayload ?? {};
        answerEntity.metadata = answerEntity.metadata ?? {};

        toSave.push(answerEntity);
      }

      if (toDeleteIds.length > 0) {
        await manager.getRepository(ExamAttemptAnswer).delete(toDeleteIds);
      }

      if (toSave.length > 0) {
        await manager.getRepository(ExamAttemptAnswer).save(toSave);
      }

      await manager.getRepository(ExamAttempt).update(attempt.id, {
        answeredCount,
      });

      return {
        attemptId: attempt.id,
        status: attempt.status,
        answeredCount,
        totalQuestions: attempt.totalQuestions,
        savedAnswers: toSave.length,
        clearedAnswers: toDeleteIds.length,
      };
    });
  }

  async submitAttempt(
    attemptId: string,
    dto: SubmitExamAttemptDto,
    userId: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const attemptRepository = manager.getRepository(ExamAttempt);
      const attempt = await attemptRepository
        .createQueryBuilder('attempt')
        .setLock('pessimistic_write')
        .where('attempt.id = :attemptId', { attemptId })
        .andWhere('attempt.userId = :userId', { userId })
        .getOne();

      if (!attempt) {
        throw new NotFoundException('Khong tim thay phien lam bai');
      }

      if (attempt.status === ExamAttemptStatus.GRADED) {
        return this.getAttemptResultInternal(attempt.id, userId);
      }

      if (attempt.status !== ExamAttemptStatus.IN_PROGRESS) {
        throw new BadRequestException(
          'Phien lam bai khong o trang thai nop bai',
        );
      }

      const snapshot = this.getSnapshot(attempt);
      const questionIndex = this.buildSnapshotQuestionIndex(snapshot);
      const answers = await manager.getRepository(ExamAttemptAnswer).find({
        where: { examAttemptId: attempt.id },
      });
      const answerMap = new Map(
        answers.map((answer) => [answer.questionId, answer]),
      );

      const scoring = this.computeAttemptScoring(snapshot, answers);

      const submittedAt = new Date();
      const durationSec = Math.max(
        Math.round(
          (submittedAt.getTime() - attempt.startedAt.getTime()) / 1000,
        ),
        0,
      );

      if (answers.length > 0) {
        await manager.getRepository(ExamAttemptAnswer).save(answers);
      }

      await manager
        .getRepository(ExamAttemptPartScore)
        .delete({ examAttemptId: attempt.id });

      const partScoreEntities = [...scoring.partStats.entries()].map(
        ([part, stats]) =>
          manager.getRepository(ExamAttemptPartScore).create({
            createdById: attempt.userId,
            examAttemptId: attempt.id,
            part,
            sectionOrder: stats.sectionOrder,
            questionCount: stats.questionCount,
            correctCount: stats.correctCount,
            rawScore: this.toNumericString(stats.rawScore),
            scaledScore: this.toNumericString(stats.scaledScore),
            durationSec: stats.durationSec > 0 ? stats.durationSec : null,
            metadata: {},
          }),
      );

      if (partScoreEntities.length > 0) {
        await manager
          .getRepository(ExamAttemptPartScore)
          .save(partScoreEntities);
      }

      attempt.status = ExamAttemptStatus.GRADED;
      attempt.submittedAt = submittedAt;
      attempt.gradedAt = submittedAt;
      attempt.durationSec = durationSec;
      attempt.answeredCount = scoring.answeredCount;
      attempt.correctCount = scoring.correctCount;
      attempt.listeningRawScore = this.toNumericString(
        scoring.listeningRawScore,
      );
      attempt.readingRawScore = this.toNumericString(scoring.readingRawScore);
      attempt.listeningScaledScore = this.toNumericString(
        scoring.listeningScaledScore,
      );
      attempt.readingScaledScore = this.toNumericString(
        scoring.readingScaledScore,
      );
      attempt.totalScore = this.toNumericString(scoring.totalScore);
      attempt.passed = scoring.totalScore >= attempt.passThresholdSnapshot;
      attempt.scoringVersion = APP_CONSTANTS.EXAM_SCORING_VERSION;
      attempt.metadata = {
        ...(attempt.metadata ?? {}),
        ...(dto.metadata ?? {}),
      };
      attempt.resultPayload = {
        listening: {
          rawScore: scoring.listeningRawScore,
          scaledScore: scoring.listeningScaledScore,
          maxScore: APP_CONSTANTS.TOEIC_MAX_DOMAIN_SCORE,
        },
        reading: {
          rawScore: scoring.readingRawScore,
          scaledScore: scoring.readingScaledScore,
          maxScore: APP_CONSTANTS.TOEIC_MAX_DOMAIN_SCORE,
        },
        answeredCount: scoring.answeredCount,
        correctCount: scoring.correctCount,
        totalQuestions: attempt.totalQuestions,
      };

      await attemptRepository.save(attempt);
      await this.credentialEligibilityService.evaluateAttempt(manager, attempt);

      return this.getAttemptResultInternal(attempt.id, userId, manager, {
        includeReview: false,
      });
    });
  }

  async getAttemptResult(attemptId: string, userId: string) {
    return this.getAttemptResultInternal(attemptId, userId);
  }

  private async getAttemptSession(
    attemptId: string,
    userId: string,
    resumed: boolean,
  ) {
    const attempt = await this.examAttemptRepository.findOne({
      where: { id: attemptId, userId },
    });

    if (!attempt) {
      throw new NotFoundException('Khong tim thay phien lam bai');
    }

    const answers = await this.examAttemptAnswerRepository.find({
      where: { examAttemptId: attempt.id },
    });
    const snapshot = await this.getHydratedSnapshot(attempt);

    return {
      resumed,
      attempt: {
        id: attempt.id,
        examTemplateId: attempt.examTemplateId,
        attemptNo: attempt.attemptNo,
        status: attempt.status,
        startedAt: attempt.startedAt,
        totalQuestions: attempt.totalQuestions,
        answeredCount: answers.length,
        durationSec: attempt.durationSec,
        mode: attempt.mode,
      },
      template: this.sanitizeSnapshotForLearner(snapshot),
      savedAnswers: answers.map((answer) => ({
        questionId: answer.questionId,
        selectedOptionKey: answer.selectedOptionKey,
        answeredAt: answer.answeredAt,
        timeSpentSec: answer.timeSpentSec,
      })),
    };
  }

  private async getAttemptResultInternal(
    attemptId: string,
    userId: string,
    manager?: EntityManager,
    options?: { includeReview?: boolean },
  ) {
    const attemptRepository =
      manager?.getRepository(ExamAttempt) ?? this.examAttemptRepository;
    const answerRepository =
      manager?.getRepository(ExamAttemptAnswer) ??
      this.examAttemptAnswerRepository;
    const partScoreRepository =
      manager?.getRepository(ExamAttemptPartScore) ??
      this.examAttemptPartScoreRepository;
    const credentialRequestRepository =
      manager?.getRepository(CredentialRequest) ??
      this.credentialRequestRepository;

    const attempt = await attemptRepository.findOne({
      where: { id: attemptId, userId },
    });

    if (!attempt) {
      throw new NotFoundException('Khong tim thay phien lam bai');
    }

    if (attempt.status !== ExamAttemptStatus.GRADED) {
      throw new BadRequestException('Bai thi chua duoc cham diem');
    }

    const [answers, credentialRequest] = await Promise.all([
      answerRepository.find({
        where: { examAttemptId: attempt.id },
        order: { questionNo: 'ASC' },
      }),
      credentialRequestRepository.findOne({
        where: { examAttemptId: attempt.id },
      }),
    ]);

    const snapshot = await this.getHydratedSnapshot(attempt);
    const scoring = this.computeAttemptScoring(snapshot, answers);
    const answerMap = new Map(
      answers.map((answer) => [answer.questionId, answer]),
    );
    const passed = scoring.totalScore >= attempt.passThresholdSnapshot;
    const storedListeningRawScore = Number(attempt.listeningRawScore);
    const storedReadingRawScore = Number(attempt.readingRawScore);
    const storedListeningScaledScore = Number(attempt.listeningScaledScore);
    const storedReadingScaledScore = Number(attempt.readingScaledScore);
    const storedTotalScore = Number(attempt.totalScore);
    const hasScoringMismatch =
      attempt.answeredCount !== scoring.answeredCount ||
      attempt.correctCount !== scoring.correctCount ||
      storedListeningRawScore !== scoring.listeningRawScore ||
      storedReadingRawScore !== scoring.readingRawScore ||
      storedListeningScaledScore !== scoring.listeningScaledScore ||
      storedReadingScaledScore !== scoring.readingScaledScore ||
      storedTotalScore !== scoring.totalScore ||
      attempt.passed !== passed ||
      attempt.scoringVersion !== APP_CONSTANTS.EXAM_SCORING_VERSION;

    if (hasScoringMismatch) {
      attempt.answeredCount = scoring.answeredCount;
      attempt.correctCount = scoring.correctCount;
      attempt.listeningRawScore = this.toNumericString(
        scoring.listeningRawScore,
      );
      attempt.readingRawScore = this.toNumericString(scoring.readingRawScore);
      attempt.listeningScaledScore = this.toNumericString(
        scoring.listeningScaledScore,
      );
      attempt.readingScaledScore = this.toNumericString(
        scoring.readingScaledScore,
      );
      attempt.totalScore = this.toNumericString(scoring.totalScore);
      attempt.passed = passed;
      attempt.scoringVersion = APP_CONSTANTS.EXAM_SCORING_VERSION;
      attempt.resultPayload = {
        listening: {
          rawScore: scoring.listeningRawScore,
          scaledScore: scoring.listeningScaledScore,
          maxScore: APP_CONSTANTS.TOEIC_MAX_DOMAIN_SCORE,
        },
        reading: {
          rawScore: scoring.readingRawScore,
          scaledScore: scoring.readingScaledScore,
          maxScore: APP_CONSTANTS.TOEIC_MAX_DOMAIN_SCORE,
        },
        answeredCount: scoring.answeredCount,
        correctCount: scoring.correctCount,
        totalQuestions: attempt.totalQuestions,
      };

      await attemptRepository.save(attempt);
    }

    const computedPartScores = [...scoring.partStats.entries()]
      .sort((left, right) => left[1].sectionOrder - right[1].sectionOrder)
      .map(([part, stats]) => ({
        part,
        sectionOrder: stats.sectionOrder,
        questionCount: stats.questionCount,
        correctCount: stats.correctCount,
        rawScore: stats.rawScore,
        scaledScore: stats.scaledScore,
        durationSec: stats.durationSec > 0 ? stats.durationSec : null,
      }));

    return {
      attempt: {
        id: attempt.id,
        examTemplateId: attempt.examTemplateId,
        attemptNo: attempt.attemptNo,
        status: attempt.status,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        gradedAt: attempt.gradedAt,
        durationSec: attempt.durationSec,
        totalQuestions: attempt.totalQuestions,
        answeredCount: scoring.answeredCount,
        correctCount: scoring.correctCount,
        listeningRawScore: scoring.listeningRawScore,
        readingRawScore: scoring.readingRawScore,
        listeningScaledScore: scoring.listeningScaledScore,
        readingScaledScore: scoring.readingScaledScore,
        totalScore: scoring.totalScore,
        passThresholdSnapshot: attempt.passThresholdSnapshot,
        passed,
        scoringVersion: attempt.scoringVersion,
      },
      partScores: computedPartScores,
      credentialRequest: credentialRequest
        ? {
            id: credentialRequest.id,
            status: credentialRequest.status,
            credentialTemplateId: credentialRequest.credentialTemplateId,
            requestedAt: credentialRequest.requestedAt,
          }
        : null,
      review:
        options?.includeReview === false
          ? undefined
          : this.buildReviewSnapshot(snapshot, answerMap),
    };
  }

  private async loadPublishedTemplate(templateId: string) {
    const template = await this.examTemplateRepository.findOne({
      where: { id: templateId },
      relations: {
        sections: true,
        items: {
          section: true,
          questionGroup: {
            assets: true,
            questions: { options: true },
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundException('Khong tim thay mau de thi');
    }

    if (template.status !== TemplateStatus.PUBLISHED) {
      throw new BadRequestException('Chi duoc bat dau mau de thi da publish');
    }

    template.sections.sort((a, b) => a.sectionOrder - b.sectionOrder);
    template.items.sort((a, b) => a.displayOrder - b.displayOrder);
    template.items.forEach((item) => {
      item.questionGroup.assets?.sort((a, b) => a.sortOrder - b.sortOrder);
      item.questionGroup.questions?.sort((a, b) => a.questionNo - b.questionNo);
      item.questionGroup.questions?.forEach((question) => {
        question.options?.sort((a, b) => a.sortOrder - b.sortOrder);
      });
    });

    return template;
  }

  private buildTemplateSnapshot(
    template: ExamTemplate,
  ): AttemptTemplateSnapshot {
    const sectionMap = new Map<string, AttemptSectionSnapshot>();

    for (const section of template.sections) {
      sectionMap.set(section.id, {
        id: section.id,
        part: section.part,
        sectionOrder: section.sectionOrder,
        expectedGroupCount: section.expectedGroupCount,
        expectedQuestionCount: section.expectedQuestionCount,
        durationSec: section.durationSec,
        instructions: section.instructions,
        items: [],
      });
    }

    for (const item of template.items) {
      const section = sectionMap.get(item.sectionId);
      if (!section) continue;

      section.items.push({
        id: item.id,
        questionGroupId: item.questionGroupId,
        displayOrder: item.displayOrder,
        sourceMode: item.sourceMode,
        locked: item.locked,
        questionGroup: {
          id: item.questionGroup.id,
          code: item.questionGroup.code,
          title: item.questionGroup.title,
          part: item.questionGroup.part,
          level: item.questionGroup.level,
          stem: item.questionGroup.stem,
          explanation: item.questionGroup.explanation,
          assets: (item.questionGroup.assets ?? []).map((asset) => ({
            id: asset.id,
            kind: asset.kind,
            storageKey: asset.storageKey,
            publicUrl: asset.publicUrl,
            mimeType: asset.mimeType,
            durationSec: asset.durationSec,
            sortOrder: asset.sortOrder,
            contentText: asset.contentText,
            metadata: asset.metadata,
          })),
          questions: (item.questionGroup.questions ?? []).map((question) => ({
            id: question.id,
            questionNo: question.questionNo,
            prompt: question.prompt,
            answerKey: question.answerKey,
            rationale: question.rationale,
            timeLimitSec: question.timeLimitSec,
            scoreWeight: Number(question.scoreWeight),
            metadata: question.metadata,
            options: (question.options ?? []).map((option) => ({
              optionKey: option.optionKey,
              content: option.content,
              sortOrder: option.sortOrder,
              isCorrect: option.isCorrect,
            })),
          })),
        },
      });
    }

    const sections = [...sectionMap.values()].sort(
      (a, b) => a.sectionOrder - b.sectionOrder,
    );

    for (const section of sections) {
      if (template.shuffleQuestionOrder) {
        section.items = this.shuffleArray(section.items).map((item, index) => ({
          ...item,
          displayOrder: index + 1,
        }));
      } else {
        section.items.sort((a, b) => a.displayOrder - b.displayOrder);
      }

      if (template.shuffleOptionOrder) {
        section.items = section.items.map((item) => ({
          ...item,
          questionGroup: {
            ...item.questionGroup,
            questions: item.questionGroup.questions.map((question) => ({
              ...question,
              options: this.shuffleArray(question.options).map(
                (option, index) => ({
                  ...option,
                  sortOrder: index + 1,
                }),
              ),
            })),
          },
        }));
      }
    }

    return {
      template: {
        id: template.id,
        code: template.code,
        name: template.name,
        mode: template.mode,
        totalDurationSec: template.totalDurationSec,
        totalQuestions: template.totalQuestions,
        instructions: template.instructions,
        shuffleQuestionOrder: template.shuffleQuestionOrder,
        shuffleOptionOrder: template.shuffleOptionOrder,
      },
      sections,
    };
  }

  private countSnapshotQuestions(snapshot: AttemptTemplateSnapshot) {
    return snapshot.sections.reduce(
      (sum, section) =>
        sum +
        section.items.reduce(
          (itemSum, item) => itemSum + item.questionGroup.questions.length,
          0,
        ),
      0,
    );
  }

  private getSnapshot(attempt: ExamAttempt) {
    return attempt.templateSnapshot as unknown as AttemptTemplateSnapshot;
  }

  private isAttemptExpired(attempt: ExamAttempt) {
    const snapshot = this.getSnapshot(attempt);
    const totalDurationSec = snapshot.template?.totalDurationSec;

    if (!totalDurationSec || totalDurationSec <= 0) {
      return false;
    }

    const startedAtMs = attempt.startedAt?.getTime?.();
    if (!startedAtMs || !Number.isFinite(startedAtMs)) {
      return false;
    }

    const elapsedSec = Math.max(
      0,
      Math.floor((Date.now() - startedAtMs) / 1000),
    );

    return elapsedSec >= totalDurationSec;
  }

  private async getHydratedSnapshot(attempt: ExamAttempt) {
    const snapshot = this.getSnapshot(attempt);

    if (!this.snapshotNeedsAssetRefresh(snapshot)) {
      return snapshot;
    }

    try {
      const template = await this.loadPublishedTemplate(attempt.examTemplateId);
      const hydratedSnapshot = this.mergeSnapshotAssets(snapshot, template);

      attempt.templateSnapshot = hydratedSnapshot as unknown as Record<
        string,
        unknown
      >;
      await this.examAttemptRepository.save(attempt);

      return hydratedSnapshot;
    } catch {
      return snapshot;
    }
  }

  private snapshotNeedsAssetRefresh(snapshot: AttemptTemplateSnapshot) {
    return snapshot.sections.some((section) =>
      section.items.some((item) => {
        const assets = item.questionGroup.assets ?? [];
        const part = item.questionGroup.part;
        const isListeningPart =
          part === QuestionPart.P1 ||
          part === QuestionPart.P2 ||
          part === QuestionPart.P3 ||
          part === QuestionPart.P4;

        if (isListeningPart && assets.length === 0) {
          return true;
        }

        return assets.some(
          (asset) =>
            (asset.kind === 'audio' || asset.kind === 'image') &&
            !asset.storageKey,
        );
      }),
    );
  }

  private mergeSnapshotAssets(
    snapshot: AttemptTemplateSnapshot,
    template: ExamTemplate,
  ): AttemptTemplateSnapshot {
    const templateGroupMap = new Map(
      template.items.map((item) => [item.questionGroupId, item.questionGroup]),
    );

    return {
      ...snapshot,
      sections: snapshot.sections.map((section) => ({
        ...section,
        items: section.items.map((item) => {
          const templateGroup = templateGroupMap.get(item.questionGroupId);
          if (!templateGroup) {
            return item;
          }

          const templateAssets = (templateGroup.assets ?? [])
            .slice()
            .sort((left, right) => left.sortOrder - right.sortOrder)
            .map((asset) => this.mapAssetToSnapshot(asset));

          if (templateAssets.length === 0) {
            return item;
          }

          const currentAssets = item.questionGroup.assets ?? [];
          const mergedAssets =
            currentAssets.length > 0
              ? currentAssets.map((asset) => {
                  const matchedAsset =
                    templateAssets.find(
                      (candidate) => candidate.id === asset.id,
                    ) ??
                    templateAssets.find(
                      (candidate) =>
                        candidate.kind === asset.kind &&
                        candidate.sortOrder === asset.sortOrder,
                    );

                  if (!matchedAsset) {
                    return asset;
                  }

                  return {
                    ...asset,
                    storageKey: asset.storageKey ?? matchedAsset.storageKey,
                    publicUrl: asset.publicUrl ?? matchedAsset.publicUrl,
                    mimeType: asset.mimeType ?? matchedAsset.mimeType,
                    durationSec: asset.durationSec ?? matchedAsset.durationSec,
                    contentText: asset.contentText ?? matchedAsset.contentText,
                    metadata:
                      Object.keys(asset.metadata ?? {}).length > 0
                        ? asset.metadata
                        : matchedAsset.metadata,
                  };
                })
              : [];

          const missingAssets = templateAssets.filter(
            (candidate) =>
              !mergedAssets.some(
                (asset) =>
                  asset.id === candidate.id ||
                  (asset.kind === candidate.kind &&
                    asset.sortOrder === candidate.sortOrder),
              ),
          );

          return {
            ...item,
            questionGroup: {
              ...item.questionGroup,
              code: item.questionGroup.code || templateGroup.code,
              title: item.questionGroup.title || templateGroup.title,
              stem: item.questionGroup.stem ?? templateGroup.stem,
              explanation:
                item.questionGroup.explanation ?? templateGroup.explanation,
              assets: [...mergedAssets, ...missingAssets].sort(
                (left, right) => left.sortOrder - right.sortOrder,
              ),
            },
          };
        }),
      })),
    };
  }

  private mapAssetToSnapshot(asset: {
    id: string;
    kind: string;
    storageKey: string;
    publicUrl: string | null;
    mimeType: string | null;
    durationSec: number | null;
    sortOrder: number;
    contentText: string | null;
    metadata: Record<string, unknown>;
  }): AttemptAssetSnapshot {
    return {
      id: asset.id,
      kind: asset.kind,
      storageKey: asset.storageKey,
      publicUrl: asset.publicUrl,
      mimeType: asset.mimeType,
      durationSec: asset.durationSec,
      sortOrder: asset.sortOrder,
      contentText: asset.contentText,
      metadata: asset.metadata,
    };
  }

  private sanitizeSnapshotForLearner(snapshot: AttemptTemplateSnapshot) {
    return {
      template: snapshot.template,
      sections: snapshot.sections.map((section) => ({
        ...section,
        items: section.items.map((item) => ({
          id: item.id,
          questionGroupId: item.questionGroupId,
          displayOrder: item.displayOrder,
          sourceMode: item.sourceMode,
          locked: item.locked,
          questionGroup: {
            id: item.questionGroup.id,
            code: item.questionGroup.code,
            title: item.questionGroup.title,
            part: item.questionGroup.part,
            level: item.questionGroup.level,
            stem: item.questionGroup.stem,
            assets: item.questionGroup.assets,
            questions: item.questionGroup.questions.map((question) => ({
              id: question.id,
              questionNo: question.questionNo,
              prompt: question.prompt,
              timeLimitSec: question.timeLimitSec,
              metadata: question.metadata,
              options: question.options.map((option) => ({
                optionKey: option.optionKey,
                content: option.content,
                sortOrder: option.sortOrder,
              })),
            })),
          },
        })),
      })),
    };
  }

  private buildReviewSnapshot(
    snapshot: AttemptTemplateSnapshot,
    answerMap: Map<string, ExamAttemptAnswer>,
  ) {
    return {
      template: snapshot.template,
      sections: snapshot.sections.map((section) => ({
        part: section.part,
        sectionOrder: section.sectionOrder,
        instructions: section.instructions,
        items: section.items.map((item) => ({
          questionGroupId: item.questionGroupId,
          displayOrder: item.displayOrder,
          questionGroup: {
            id: item.questionGroup.id,
            code: item.questionGroup.code,
            title: item.questionGroup.title,
            stem: item.questionGroup.stem,
            explanation: item.questionGroup.explanation,
            assets: item.questionGroup.assets,
            questions: item.questionGroup.questions.map((question) => {
              const answer = answerMap.get(question.id);
              return {
                id: question.id,
                questionNo: question.questionNo,
                prompt: question.prompt,
                selectedOptionKey: answer?.selectedOptionKey ?? null,
                correctOptionKey: question.answerKey,
                isCorrect: answer?.isCorrect ?? false,
                rationale: question.rationale,
                scoreAwarded: answer ? Number(answer.scoreAwarded) : 0,
                options: question.options.map((option) => ({
                  optionKey: option.optionKey,
                  content: option.content,
                  sortOrder: option.sortOrder,
                  isCorrect: option.isCorrect,
                })),
              };
            }),
          },
        })),
      })),
    };
  }

  private buildSnapshotQuestionIndex(snapshot: AttemptTemplateSnapshot) {
    const index = new Map<string, SnapshotQuestionContext>();

    for (const section of snapshot.sections) {
      for (const item of section.items) {
        for (const question of item.questionGroup.questions) {
          index.set(question.id, {
            section,
            item,
            question,
          });
        }
      }
    }

    return index;
  }

  private resolveSelectedOption(
    question: AttemptQuestionSnapshot,
    selectedOptionKey?: string | null,
  ) {
    const normalized = selectedOptionKey?.trim();
    if (!normalized) {
      return null;
    }

    const option = question.options.find(
      (candidate) =>
        candidate.optionKey.toLowerCase() === normalized.toLowerCase(),
    );

    if (!option) {
      throw new BadRequestException(
        `Lua chon khong hop le cho cau hoi ${question.id}: ${selectedOptionKey}`,
      );
    }

    return option;
  }

  private computeAttemptScoring(
    snapshot: AttemptTemplateSnapshot,
    answers: ExamAttemptAnswer[],
  ): AttemptScoreComputation {
    const questionIndex = this.buildSnapshotQuestionIndex(snapshot);
    const answerMap = new Map(
      answers.map((answer) => [answer.questionId, answer]),
    );

    let answeredCount = 0;
    let correctCount = 0;
    let listeningAvailableWeight = 0;
    let readingAvailableWeight = 0;
    let listeningQuestionCount = 0;
    let readingQuestionCount = 0;
    let listeningCorrectCount = 0;
    let readingCorrectCount = 0;
    let listeningRawScore = 0;
    let readingRawScore = 0;

    const partStats = new Map<QuestionPart, AttemptPartScoreComputation>();

    for (const questionContext of questionIndex.values()) {
      const scoreWeight = Number(questionContext.question.scoreWeight ?? 1);
      const answer = answerMap.get(questionContext.question.id);
      const isCorrect = this.isAnswerCorrect(
        answer?.selectedOptionKey,
        questionContext.question.answerKey,
      );
      const scoreAwarded = isCorrect ? scoreWeight : 0;

      if (answer) {
        answeredCount += 1;
        answer.isCorrect = isCorrect;
        answer.scoreWeightSnapshot = this.toNumericString(scoreWeight);
        answer.scoreAwarded = this.toNumericString(scoreAwarded);
      }

      if (isCorrect) {
        correctCount += 1;
      }

      const domain = this.getPartDomain(questionContext.section.part);
      if (domain === 'listening') {
        listeningQuestionCount += 1;
        listeningAvailableWeight += scoreWeight;
        listeningRawScore += scoreAwarded;
        listeningCorrectCount += isCorrect ? 1 : 0;
      } else {
        readingQuestionCount += 1;
        readingAvailableWeight += scoreWeight;
        readingRawScore += scoreAwarded;
        readingCorrectCount += isCorrect ? 1 : 0;
      }

      const currentPart = partStats.get(questionContext.section.part) ?? {
        sectionOrder: questionContext.section.sectionOrder,
        questionCount: 0,
        correctCount: 0,
        rawScore: 0,
        scaledScore: 0,
        durationSec: 0,
      };

      currentPart.questionCount += 1;
      currentPart.rawScore += scoreAwarded;
      currentPart.correctCount += isCorrect ? 1 : 0;
      currentPart.durationSec += answer?.timeSpentSec ?? 0;
      partStats.set(questionContext.section.part, currentPart);
    }

    const listeningScaledScore = this.scaleDomainScore(
      'listening',
      listeningCorrectCount,
      listeningQuestionCount,
      listeningRawScore,
      listeningAvailableWeight,
    );
    const readingScaledScore = this.scaleDomainScore(
      'reading',
      readingCorrectCount,
      readingQuestionCount,
      readingRawScore,
      readingAvailableWeight,
    );

    for (const [part, stats] of partStats.entries()) {
      const domain =
        this.getPartDomain(part) === 'listening' ? 'listening' : 'reading';
      const domainWeight =
        this.getPartDomain(part) === 'listening'
          ? listeningAvailableWeight
          : readingAvailableWeight;
      const domainRawScore =
        domain === 'listening' ? listeningRawScore : readingRawScore;
      const domainScaledScore =
        domain === 'listening' ? listeningScaledScore : readingScaledScore;
      stats.scaledScore = this.scalePartScore(
        stats.rawScore,
        domainRawScore,
        domainScaledScore,
        domainWeight,
      );
    }

    return {
      answeredCount,
      correctCount,
      listeningCorrectCount,
      readingCorrectCount,
      listeningQuestionCount,
      readingQuestionCount,
      listeningRawScore,
      readingRawScore,
      listeningScaledScore,
      readingScaledScore,
      totalScore: listeningScaledScore + readingScaledScore,
      partStats,
    };
  }

  private isAnswerCorrect(
    selectedOptionKey?: string | null,
    answerKey?: string | null,
  ) {
    const selected = selectedOptionKey?.trim().toLowerCase();
    const correct = answerKey?.trim().toLowerCase();

    if (!selected || !correct) {
      return false;
    }

    return selected === correct;
  }

  private ensureUniqueQuestionIds(questionIds: string[]) {
    const seen = new Set<string>();

    for (const questionId of questionIds) {
      if (seen.has(questionId)) {
        throw new BadRequestException(
          `Question bi lap trong payload luu dap an: ${questionId}`,
        );
      }
      seen.add(questionId);
    }
  }

  private getPartDomain(part: QuestionPart) {
    if (
      part === QuestionPart.P1 ||
      part === QuestionPart.P2 ||
      part === QuestionPart.P3 ||
      part === QuestionPart.P4
    ) {
      return 'listening';
    }

    return 'reading';
  }

  private scaleDomainScore(
    domain: ToeicDomain,
    correctCount: number,
    questionCount: number,
    rawScore: number,
    availableWeight: number,
  ) {
    if (questionCount <= 0 || availableWeight <= 0) {
      return 0;
    }

    const fullDomainQuestionCount =
      domain === 'listening'
        ? APP_CONSTANTS.LISTENING_QUESTIONS
        : APP_CONSTANTS.READING_QUESTIONS;

    if (questionCount === fullDomainQuestionCount) {
      return this.lookupToeicDomainScore(domain, correctCount);
    }

    return Number(
      (
        (rawScore / availableWeight) *
        APP_CONSTANTS.TOEIC_MAX_DOMAIN_SCORE
      ).toFixed(2),
    );
  }

  private lookupToeicDomainScore(domain: ToeicDomain, correctCount: number) {
    const normalizedCorrectCount = Math.max(
      0,
      Math.min(correctCount, APP_CONSTANTS.LISTENING_QUESTIONS),
    );
    const scoreTable =
      domain === 'listening'
        ? TOEIC_LISTENING_SCORE_TABLE
        : TOEIC_READING_SCORE_TABLE;

    return (
      scoreTable[normalizedCorrectCount] ?? APP_CONSTANTS.TOEIC_MAX_DOMAIN_SCORE
    );
  }

  private scalePartScore(
    partRawScore: number,
    domainRawScore: number,
    domainScaledScore: number,
    _domainWeight: number,
  ) {
    if (domainScaledScore <= 0 || domainRawScore <= 0) {
      return 0;
    }

    return Number(
      ((partRawScore / domainRawScore) * domainScaledScore).toFixed(2),
    );
  }

  private toNumericString(value: number) {
    return value.toFixed(2);
  }

  private shuffleArray<T>(items: T[]) {
    const cloned = [...items];

    for (let index = cloned.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [cloned[index], cloned[randomIndex]] = [
        cloned[randomIndex],
        cloned[index],
      ];
    }

    return cloned;
  }
}
