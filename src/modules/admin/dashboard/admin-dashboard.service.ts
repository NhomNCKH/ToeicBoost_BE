import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThanOrEqual, Repository } from 'typeorm';
import { CredentialStatus } from '@common/constants/credential.enum';
import {
  TemplateMode,
  TemplateStatus,
} from '@common/constants/exam-template.enum';
import {
  QuestionPart,
  QuestionGroupStatus,
} from '@common/constants/question-bank.enum';
import { ExamAttemptStatus } from '@common/constants/assessment.enum';
import { UserStatus } from '@common/constants/user.enum';
import { User } from '@modules/security/entities/user.entity';
import { Credential } from '@modules/admin/credential/entities/credential.entity';
import { ExamTemplate } from '@modules/admin/exam-template/entities/exam-template.entity';
import { QuestionGroup } from '@modules/admin/question-bank/entities/question-group.entity';
import { Question } from '@modules/admin/question-bank/entities/question.entity';
import { ExamAttempt } from '@modules/assessment/exam-attempt/entities/exam-attempt.entity';
import { OfficialResultsQueryDto } from './dto/official-results-query.dto';

type CountBucket = {
  key: string;
  count: number;
};

type PartCoverageBucket = {
  part: string;
  groupCount: number;
  questionCount: number;
};

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Credential)
    private readonly credentialRepository: Repository<Credential>,
    @InjectRepository(ExamTemplate)
    private readonly examTemplateRepository: Repository<ExamTemplate>,
    @InjectRepository(QuestionGroup)
    private readonly questionGroupRepository: Repository<QuestionGroup>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(ExamAttempt)
    private readonly examAttemptRepository: Repository<ExamAttempt>,
  ) {}

  async getSummary() {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalUsers,
      activeUsers,
      newUsersLast7Days,
      totalTemplates,
      publishedTemplates,
      templateModesRaw,
      totalQuestionGroups,
      publishedQuestionGroups,
      totalQuestionsRaw,
      questionCoverageRaw,
      totalCredentials,
      issuedCredentials,
      credentialsLast30Days,
      recentUsers,
      recentCredentials,
      totalAttempts,
      gradedAttempts,
      inProgressAttempts,
      attemptsLast7Days,
      averageScoreRaw,
      attemptStatusesRaw,
      recentAttempts,
    ] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.countBy({ status: UserStatus.ACTIVE }),
      this.userRepository.countBy({ createdAt: MoreThanOrEqual(sevenDaysAgo) }),
      this.examTemplateRepository.count(),
      this.examTemplateRepository.countBy({ status: TemplateStatus.PUBLISHED }),
      this.examTemplateRepository
        .createQueryBuilder('template')
        .select('template.mode', 'key')
        .addSelect('COUNT(template.id)', 'count')
        .groupBy('template.mode')
        .getRawMany(),
      this.questionGroupRepository.countBy({ deletedAt: IsNull() }),
      this.questionGroupRepository.countBy({
        deletedAt: IsNull(),
        status: QuestionGroupStatus.PUBLISHED,
      }),
      this.questionRepository
        .createQueryBuilder('question')
        .innerJoin(
          'question.questionGroup',
          'questionGroup',
          'questionGroup.deletedAt IS NULL',
        )
        .select('COUNT(question.id)', 'count')
        .getRawOne(),
      this.questionGroupRepository
        .createQueryBuilder('questionGroup')
        .leftJoin('questionGroup.questions', 'question')
        .select('questionGroup.part', 'part')
        .addSelect('COUNT(DISTINCT questionGroup.id)', 'groupCount')
        .addSelect('COUNT(question.id)', 'questionCount')
        .where('questionGroup.deletedAt IS NULL')
        .groupBy('questionGroup.part')
        .getRawMany(),
      this.credentialRepository.count(),
      this.credentialRepository.countBy({ status: CredentialStatus.ISSUED }),
      this.credentialRepository.countBy({
        issuedAt: MoreThanOrEqual(thirtyDaysAgo),
      }),
      this.userRepository
        .createQueryBuilder('user')
        .select('user.id', 'id')
        .addSelect('user.name', 'name')
        .addSelect('user.email', 'email')
        .addSelect('user.status', 'status')
        .addSelect('user.createdAt', 'createdAt')
        .addSelect('user.lastLoginAt', 'lastLoginAt')
        .orderBy('user.createdAt', 'DESC')
        .limit(5)
        .getRawMany(),
      this.credentialRepository
        .createQueryBuilder('credential')
        .leftJoin('credential.user', 'user')
        .select('credential.id', 'id')
        .addSelect('credential.serialNumber', 'serialNumber')
        .addSelect('credential.status', 'status')
        .addSelect('credential.issuedAt', 'issuedAt')
        .addSelect('user.id', 'userId')
        .addSelect('user.name', 'userName')
        .addSelect('user.email', 'userEmail')
        .orderBy('credential.issuedAt', 'DESC')
        .limit(5)
        .getRawMany(),
      this.examAttemptRepository.count(),
      this.examAttemptRepository.countBy({ status: ExamAttemptStatus.GRADED }),
      this.examAttemptRepository.countBy({
        status: ExamAttemptStatus.IN_PROGRESS,
      }),
      this.examAttemptRepository.countBy({
        startedAt: MoreThanOrEqual(sevenDaysAgo),
      }),
      this.examAttemptRepository
        .createQueryBuilder('attempt')
        .select('AVG(attempt.totalScore)', 'average')
        .where('attempt.status = :status', {
          status: ExamAttemptStatus.GRADED,
        })
        .getRawOne(),
      this.examAttemptRepository
        .createQueryBuilder('attempt')
        .select('attempt.status', 'key')
        .addSelect('COUNT(attempt.id)', 'count')
        .groupBy('attempt.status')
        .getRawMany(),
      this.examAttemptRepository
        .createQueryBuilder('attempt')
        .leftJoin('attempt.user', 'user')
        .leftJoin('attempt.examTemplate', 'template')
        .select('attempt.id', 'id')
        .addSelect('attempt.attemptNo', 'attemptNo')
        .addSelect('attempt.status', 'status')
        .addSelect('attempt.totalScore', 'totalScore')
        .addSelect('attempt.correctCount', 'correctCount')
        .addSelect('attempt.answeredCount', 'answeredCount')
        .addSelect('attempt.totalQuestions', 'totalQuestions')
        .addSelect('attempt.startedAt', 'startedAt')
        .addSelect('attempt.submittedAt', 'submittedAt')
        .addSelect('attempt.durationSec', 'durationSec')
        .addSelect('user.id', 'userId')
        .addSelect('user.name', 'userName')
        .addSelect('user.email', 'userEmail')
        .addSelect('template.id', 'templateId')
        .addSelect('template.name', 'templateName')
        .addSelect('template.mode', 'templateMode')
        .orderBy('attempt.startedAt', 'DESC')
        .limit(6)
        .getRawMany(),
    ]);

    const totalQuestions = this.toNumber(totalQuestionsRaw?.count);
    const averageTotalScore = this.roundToOneDecimal(
      this.toNumber(averageScoreRaw?.average),
    );

    return {
      latestUpdatedAt: now.toISOString(),
      summary: {
        totalUsers,
        activeUsers,
        totalTemplates,
        publishedTemplates,
        totalQuestionGroups,
        publishedQuestionGroups,
        totalQuestions,
        totalCredentials,
        issuedCredentials,
        totalAttempts,
        gradedAttempts,
        inProgressAttempts,
        averageTotalScore,
      },
      activity: {
        newUsersLast7Days,
        attemptsLast7Days,
        credentialsLast30Days,
      },
      templateModes: this.fillCountBuckets(
        [
          TemplateMode.PRACTICE,
          TemplateMode.MOCK_TEST,
          TemplateMode.OFFICIAL_EXAM,
        ],
        templateModesRaw,
      ),
      attemptStatuses: this.fillCountBuckets(
        [
          ExamAttemptStatus.IN_PROGRESS,
          ExamAttemptStatus.SUBMITTED,
          ExamAttemptStatus.GRADED,
          ExamAttemptStatus.ABANDONED,
          ExamAttemptStatus.CANCELLED,
        ],
        attemptStatusesRaw,
      ),
      questionCoverage: this.fillPartCoverage(questionCoverageRaw),
      recentUsers: recentUsers.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      })),
      recentCredentials: recentCredentials.map((credential) => ({
        id: credential.id,
        serialNumber: credential.serialNumber,
        status: credential.status,
        issuedAt: credential.issuedAt,
        user: credential.userId
          ? {
              id: credential.userId,
              name: credential.userName,
              email: credential.userEmail,
            }
          : null,
      })),
      recentAttempts: recentAttempts.map((attempt) => ({
        id: attempt.id,
        attemptNo: this.toNumber(attempt.attemptNo),
        status: attempt.status,
        totalScore: this.roundToOneDecimal(this.toNumber(attempt.totalScore)),
        correctCount: this.toNumber(attempt.correctCount),
        answeredCount: this.toNumber(attempt.answeredCount),
        totalQuestions: this.toNumber(attempt.totalQuestions),
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        durationSec:
          attempt.durationSec === null
            ? null
            : this.toNumber(attempt.durationSec),
        user: attempt.userId
          ? {
              id: attempt.userId,
              name: attempt.userName,
              email: attempt.userEmail,
            }
          : null,
        template: attempt.templateId
          ? {
              id: attempt.templateId,
              name: attempt.templateName,
              mode: attempt.templateMode,
            }
          : null,
      })),
    };
  }

  async getOfficialResults(query: OfficialResultsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const passScoreMin = query.passScoreMin ?? 500;
    const skip = (page - 1) * limit;
    const keyword = query.keyword?.trim();

    const baseQuery = this.examAttemptRepository
      .createQueryBuilder('attempt')
      .leftJoin('attempt.user', 'user')
      .leftJoin('attempt.examTemplate', 'template')
      .where('template.mode = :mode', { mode: TemplateMode.OFFICIAL_EXAM });

    if (query.status) {
      baseQuery.andWhere('attempt.status = :status', { status: query.status });
    }

    if (keyword) {
      baseQuery.andWhere(
        `(
          user.name ILIKE :keyword
          OR user.email ILIKE :keyword
          OR template.name ILIKE :keyword
          OR template.code ILIKE :keyword
        )`,
        { keyword: `%${keyword}%` },
      );
    }

    if (query.eligibleOnly) {
      baseQuery.andWhere('attempt.totalScore >= :passScoreMin', { passScoreMin });
    }

    const total = await baseQuery.getCount();

    const rows = await baseQuery
      .clone()
      .select('attempt.id', 'id')
      .addSelect('attempt.status', 'status')
      .addSelect('attempt.totalScore', 'totalScore')
      .addSelect('attempt.passThresholdSnapshot', 'passThresholdSnapshot')
      .addSelect('attempt.startedAt', 'startedAt')
      .addSelect('attempt.submittedAt', 'submittedAt')
      .addSelect('user.id', 'userId')
      .addSelect('user.name', 'userName')
      .addSelect('user.email', 'userEmail')
      .addSelect('template.id', 'templateId')
      .addSelect('template.name', 'templateName')
      .addSelect('template.code', 'templateCode')
      .addSelect(
        `EXISTS (
          SELECT 1
          FROM credential_requests cr
          INNER JOIN credentials c ON c.request_id = cr.id
          WHERE cr.exam_attempt_id = attempt.id
        )`,
        'hasIssuedCredential',
      )
      .addSelect(
        `EXISTS (
          SELECT 1
          FROM proctoring_violations pv
          WHERE pv.exam_attempt_id = attempt.id
        )`,
        'hasViolation',
      )
      .addSelect(
        `(
          SELECT COUNT(1)
          FROM proctoring_violations pv
          WHERE pv.exam_attempt_id = attempt.id
        )`,
        'violationCount',
      )
      .orderBy('attempt.submittedAt', 'DESC', 'NULLS LAST')
      .addOrderBy('attempt.startedAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getRawMany();

    return {
      success: true,
      data: {
        items: rows.map((row) => {
          const totalScore = this.roundToOneDecimal(this.toNumber(row.totalScore));
          const passThresholdSnapshot = this.toNumber(row.passThresholdSnapshot);
          const passThreshold = passThresholdSnapshot > 0 ? passThresholdSnapshot : passScoreMin;

          return {
            id: row.id,
            status: row.status,
            totalScore,
            passThreshold,
            isEligible: totalScore > passScoreMin,
            startedAt: row.startedAt,
            submittedAt: row.submittedAt,
            issueStatus:
              row.hasIssuedCredential === true || row.hasIssuedCredential === 'true'
                ? 'issued'
                : 'not_issued',
            hasViolation:
              row.hasViolation === true || row.hasViolation === 'true',
            violationCount: this.toNumber(row.violationCount),
            user: row.userId
              ? {
                  id: row.userId,
                  name: row.userName,
                  email: row.userEmail,
                }
              : null,
            template: row.templateId
              ? {
                  id: row.templateId,
                  name: row.templateName,
                  code: row.templateCode,
                  mode: TemplateMode.OFFICIAL_EXAM,
                }
              : null,
          };
        }),
        meta: {
          total,
          page,
          limit,
        },
      },
    };
  }

  private fillCountBuckets(
    keys: string[],
    rawRows: Array<{ key: string; count: string | number }>,
  ): CountBucket[] {
    const valueMap = new Map(
      rawRows.map((row) => [row.key, this.toNumber(row.count)]),
    );

    return keys.map((key) => ({
      key,
      count: valueMap.get(key) ?? 0,
    }));
  }

  private fillPartCoverage(
    rawRows: Array<{
      part: string;
      groupCount: string | number;
      questionCount: string | number;
    }>,
  ): PartCoverageBucket[] {
    const valueMap = new Map(
      rawRows.map((row) => [
        row.part,
        {
          groupCount: this.toNumber(row.groupCount),
          questionCount: this.toNumber(row.questionCount),
        },
      ]),
    );

    return [
      QuestionPart.P1,
      QuestionPart.P2,
      QuestionPart.P3,
      QuestionPart.P4,
      QuestionPart.P5,
      QuestionPart.P6,
      QuestionPart.P7,
    ].map((part) => ({
      part,
      groupCount: valueMap.get(part)?.groupCount ?? 0,
      questionCount: valueMap.get(part)?.questionCount ?? 0,
    }));
  }

  private roundToOneDecimal(value: number): number {
    return Math.round(value * 10) / 10;
  }

  private toNumber(value: string | number | null | undefined): number {
    if (value === null || value === undefined) {
      return 0;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
