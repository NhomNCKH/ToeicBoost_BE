import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { APP_CONSTANTS } from '@common/constants/app.constant';
import { ExamAttemptStatus } from '@common/constants/assessment.enum';
import { TemplateStatus } from '@common/constants/exam-template.enum';
import { QuestionPart } from '@common/constants/question-bank.enum';
import { CredentialRequest } from '@modules/admin/credential/entities/credential-request.entity';
import { ExamTemplate } from '@modules/admin/exam-template/entities/exam-template.entity';
import {
  LearnerExamTemplateQueryDto,
  SaveExamAttemptAnswersDto,
  StartExamAttemptDto,
  SubmitExamAttemptDto,
} from './dto/exam-attempt.dto';
import { ExamAttemptAnswer } from './entities/exam-attempt-answer.entity';
import { ExamAttemptPartScore } from './entities/exam-attempt-part-score.entity';
import { ExamAttempt } from './entities/exam-attempt.entity';
import { CredentialEligibilityService } from './credential-eligibility.service';

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
          totalPages: Math.max(1, Math.ceil(total / Math.max(query.limit ?? 20, 1))),
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
      return this.getAttemptSession(existingAttempt.id, userId, true);
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
    const attempt = await this.examAttemptRepository.findOne({
      where: { id: attemptId, userId },
    });

    if (!attempt) {
      throw new NotFoundException('Khong tim thay phien lam bai');
    }

    if (attempt.status !== ExamAttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('Chi duoc luu dap an khi bai thi dang mo');
    }

    this.ensureUniqueQuestionIds(dto.answers.map((item) => item.questionId));

    const snapshot = this.getSnapshot(attempt);
    const questionIndex = this.buildSnapshotQuestionIndex(snapshot);
    const existingAnswers = await this.examAttemptAnswerRepository.find({
      where: { examAttemptId: attempt.id },
    });
    const existingMap = new Map(
      existingAnswers.map((answer) => [answer.questionId, answer]),
    );

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
        }
        continue;
      }

      const answerEntity =
        existing ??
        this.examAttemptAnswerRepository.create({
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

    await this.dataSource.transaction(async (manager) => {
      if (toDeleteIds.length > 0) {
        await manager.getRepository(ExamAttemptAnswer).delete(toDeleteIds);
      }

      if (toSave.length > 0) {
        await manager.getRepository(ExamAttemptAnswer).save(toSave);
      }

      const answeredCount = await manager
        .getRepository(ExamAttemptAnswer)
        .count({
          where: { examAttemptId: attempt.id },
        });

      await manager.getRepository(ExamAttempt).update(attempt.id, {
        answeredCount,
      });
    });

    const refreshedAttempt = await this.examAttemptRepository.findOneOrFail({
      where: { id: attempt.id },
    });

    return {
      attemptId: refreshedAttempt.id,
      status: refreshedAttempt.status,
      answeredCount: refreshedAttempt.answeredCount,
      totalQuestions: refreshedAttempt.totalQuestions,
      savedAnswers: toSave.length,
      clearedAnswers: toDeleteIds.length,
    };
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

      let answeredCount = 0;
      let correctCount = 0;
      let listeningAvailableWeight = 0;
      let readingAvailableWeight = 0;
      let listeningRawScore = 0;
      let readingRawScore = 0;

      const partStats = new Map<
        QuestionPart,
        {
          sectionOrder: number;
          questionCount: number;
          correctCount: number;
          rawScore: number;
          scaledScore: number;
          durationSec: number;
        }
      >();

      for (const questionContext of questionIndex.values()) {
        const scoreWeight = Number(questionContext.question.scoreWeight ?? 1);
        const answer = answerMap.get(questionContext.question.id);
        const isCorrect =
          answer?.selectedOptionKey === questionContext.question.answerKey;
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
          listeningAvailableWeight += scoreWeight;
          listeningRawScore += scoreAwarded;
        } else {
          readingAvailableWeight += scoreWeight;
          readingRawScore += scoreAwarded;
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
        listeningRawScore,
        listeningAvailableWeight,
      );
      const readingScaledScore = this.scaleDomainScore(
        readingRawScore,
        readingAvailableWeight,
      );

      for (const [part, stats] of partStats.entries()) {
        const domainWeight =
          this.getPartDomain(part) === 'listening'
            ? listeningAvailableWeight
            : readingAvailableWeight;
        stats.scaledScore = this.scaleDomainScore(stats.rawScore, domainWeight);
      }

      const submittedAt = new Date();
      const durationSec = Math.max(
        Math.round(
          (submittedAt.getTime() - attempt.startedAt.getTime()) / 1000,
        ),
        0,
      );
      const totalScore = listeningScaledScore + readingScaledScore;

      if (answers.length > 0) {
        await manager.getRepository(ExamAttemptAnswer).save(answers);
      }

      await manager
        .getRepository(ExamAttemptPartScore)
        .delete({ examAttemptId: attempt.id });

      const partScoreEntities = [...partStats.entries()].map(([part, stats]) =>
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
      attempt.answeredCount = answeredCount;
      attempt.correctCount = correctCount;
      attempt.listeningRawScore = this.toNumericString(listeningRawScore);
      attempt.readingRawScore = this.toNumericString(readingRawScore);
      attempt.listeningScaledScore = this.toNumericString(listeningScaledScore);
      attempt.readingScaledScore = this.toNumericString(readingScaledScore);
      attempt.totalScore = this.toNumericString(totalScore);
      attempt.passed = totalScore >= attempt.passThresholdSnapshot;
      attempt.metadata = {
        ...(attempt.metadata ?? {}),
        ...(dto.metadata ?? {}),
      };
      attempt.resultPayload = {
        listening: {
          rawScore: listeningRawScore,
          scaledScore: listeningScaledScore,
          maxScore: APP_CONSTANTS.TOEIC_MAX_DOMAIN_SCORE,
        },
        reading: {
          rawScore: readingRawScore,
          scaledScore: readingScaledScore,
          maxScore: APP_CONSTANTS.TOEIC_MAX_DOMAIN_SCORE,
        },
        answeredCount,
        correctCount,
        totalQuestions: attempt.totalQuestions,
      };

      await attemptRepository.save(attempt);
      await this.credentialEligibilityService.evaluateAttempt(manager, attempt);

      return this.getAttemptResultInternal(attempt.id, userId);
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
      template: this.sanitizeSnapshotForLearner(this.getSnapshot(attempt)),
      savedAnswers: answers.map((answer) => ({
        questionId: answer.questionId,
        selectedOptionKey: answer.selectedOptionKey,
        answeredAt: answer.answeredAt,
        timeSpentSec: answer.timeSpentSec,
      })),
    };
  }

  private async getAttemptResultInternal(attemptId: string, userId: string) {
    const attempt = await this.examAttemptRepository.findOne({
      where: { id: attemptId, userId },
    });

    if (!attempt) {
      throw new NotFoundException('Khong tim thay phien lam bai');
    }

    if (attempt.status !== ExamAttemptStatus.GRADED) {
      throw new BadRequestException('Bai thi chua duoc cham diem');
    }

    const [answers, partScores, credentialRequest] = await Promise.all([
      this.examAttemptAnswerRepository.find({
        where: { examAttemptId: attempt.id },
        order: { questionNo: 'ASC' },
      }),
      this.examAttemptPartScoreRepository.find({
        where: { examAttemptId: attempt.id },
        order: { sectionOrder: 'ASC' },
      }),
      this.credentialRequestRepository.findOne({
        where: { examAttemptId: attempt.id },
      }),
    ]);

    const answerMap = new Map(
      answers.map((answer) => [answer.questionId, answer]),
    );
    const snapshot = this.getSnapshot(attempt);

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
        answeredCount: attempt.answeredCount,
        correctCount: attempt.correctCount,
        listeningRawScore: Number(attempt.listeningRawScore),
        readingRawScore: Number(attempt.readingRawScore),
        listeningScaledScore: Number(attempt.listeningScaledScore),
        readingScaledScore: Number(attempt.readingScaledScore),
        totalScore: Number(attempt.totalScore),
        passThresholdSnapshot: attempt.passThresholdSnapshot,
        passed: attempt.passed,
        scoringVersion: attempt.scoringVersion,
      },
      partScores: partScores.map((partScore) => ({
        part: partScore.part,
        sectionOrder: partScore.sectionOrder,
        questionCount: partScore.questionCount,
        correctCount: partScore.correctCount,
        rawScore: Number(partScore.rawScore),
        scaledScore: Number(partScore.scaledScore),
        durationSec: partScore.durationSec,
      })),
      credentialRequest: credentialRequest
        ? {
            id: credentialRequest.id,
            status: credentialRequest.status,
            credentialTemplateId: credentialRequest.credentialTemplateId,
            requestedAt: credentialRequest.requestedAt,
          }
        : null,
      review: this.buildReviewSnapshot(snapshot, answerMap),
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

  private scaleDomainScore(rawScore: number, availableWeight: number) {
    if (availableWeight <= 0) {
      return 0;
    }

    return Number(
      (
        (rawScore / availableWeight) *
        APP_CONSTANTS.TOEIC_MAX_DOMAIN_SCORE
      ).toFixed(2),
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
