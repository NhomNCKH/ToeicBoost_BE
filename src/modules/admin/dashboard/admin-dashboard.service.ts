import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomUUID } from 'crypto';
import { IsNull, MoreThanOrEqual, Repository } from 'typeorm';
import { APP_CONSTANTS } from '@common/constants/app.constant';
import {
  CredentialEventType,
  CredentialRequestStatus,
  CredentialStatus,
  CredentialTemplateStatus,
} from '@common/constants/credential.enum';
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
import { CredentialRequest } from '@modules/admin/credential/entities/credential-request.entity';
import { CredentialTemplate } from '@modules/admin/credential/entities/credential-template.entity';
import { CredentialEvent } from '@modules/admin/credential/entities/credential-event.entity';
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

const PROJECT_BRAND_NAME = 'TOEIC MASTER';
const PROJECT_DID_NAMESPACE = 'toeic-master';

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Credential)
    private readonly credentialRepository: Repository<Credential>,
    @InjectRepository(CredentialRequest)
    private readonly credentialRequestRepository: Repository<CredentialRequest>,
    @InjectRepository(CredentialTemplate)
    private readonly credentialTemplateRepository: Repository<CredentialTemplate>,
    @InjectRepository(CredentialEvent)
    private readonly credentialEventRepository: Repository<CredentialEvent>,
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
      .addSelect('attempt.listeningScaledScore', 'listeningScaledScore')
      .addSelect('attempt.readingScaledScore', 'readingScaledScore')
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
            listeningScore: this.roundToOneDecimal(
              this.toNumber(row.listeningScaledScore),
            ),
            readingScore: this.roundToOneDecimal(
              this.toNumber(row.readingScaledScore),
            ),
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

  async issueCertificateForAttempt(attemptId: string, adminUserId: string) {
    const attempt = await this.examAttemptRepository.findOne({
      where: { id: attemptId },
      relations: { user: true, examTemplate: true },
    });

    if (!attempt) {
      throw new NotFoundException('Khong tim thay bai thi');
    }

    if (attempt.mode !== TemplateMode.OFFICIAL_EXAM) {
      throw new BadRequestException(
        'Chi cap chung chi cho bai thi chinh thuc',
      );
    }

    if (attempt.status !== ExamAttemptStatus.GRADED) {
      throw new BadRequestException(
        'Chi cap chung chi cho bai thi da cham diem',
      );
    }

    const totalScore = this.toNumber(attempt.totalScore);
    const passThreshold =
      attempt.passThresholdSnapshot ?? APP_CONSTANTS.CERTIFICATE_PASS_THRESHOLD;

    if (totalScore <= passThreshold) {
      throw new BadRequestException(
        `Bai thi chua dat nguong cap chung chi (${passThreshold})`,
      );
    }

    const existingIssued = await this.credentialRepository
      .createQueryBuilder('credential')
      .innerJoin('credential.request', 'request')
      .where('request.examAttemptId = :attemptId', { attemptId })
      .getOne();

    if (existingIssued) {
      const credential = existingIssued;
      return {
        issued: false,
        alreadyIssued: true,
        credentialId: credential?.id ?? null,
        issueStatus: 'issued',
      };
    }

    let request = await this.credentialRequestRepository.findOne({
      where: { examAttemptId: attempt.id },
      relations: { credentialTemplate: true },
    });

    if (!request) {
      const template =
        (await this.findMatchingCredentialTemplate(totalScore)) ??
        (await this.ensureDefaultCredentialTemplate(adminUserId));

      request = await this.credentialRequestRepository.save(
        this.credentialRequestRepository.create({
          createdById: adminUserId,
          status: CredentialRequestStatus.PENDING,
          userId: attempt.userId,
          credentialTemplateId: template.id,
          examTemplateId: attempt.examTemplateId,
          examAttemptId: attempt.id,
          eligibilitySource: 'admin_issue_manual',
          sourceRef: attempt.id,
          eligibilityScore: attempt.totalScore,
          passThresholdSnapshot: passThreshold,
          requestedAt: new Date(),
          approvedPayload: {},
          metadata: { autoGenerated: false, createdFrom: 'admin_dashboard' },
        }),
      );
    }

    if (request.status === CredentialRequestStatus.REJECTED) {
      throw new BadRequestException(
        'Yeu cau nay da bi tu choi, khong the cap chung chi',
      );
    }

    const template =
      request.credentialTemplate ??
      (await this.credentialTemplateRepository.findOne({
        where: { id: request.credentialTemplateId },
      }));

    const resolvedTemplate =
      template ?? (await this.ensureDefaultCredentialTemplate(adminUserId));
    if (!template) {
      request.credentialTemplateId = resolvedTemplate.id;
      await this.credentialRequestRepository.save(request);
    }

    const now = new Date();
    request.status = CredentialRequestStatus.APPROVED;
    request.decisionAt = now;
    request.decidedById = adminUserId;
    request.rejectionReason = null;
    request.approvedPayload = {
      ...(request.approvedPayload ?? {}),
      approvedBy: adminUserId,
      approvedAt: now.toISOString(),
      totalScore,
      passThreshold,
      examAttemptId: attempt.id,
      examTemplateId: attempt.examTemplateId,
    };
    request.metadata = {
      ...(request.metadata ?? {}),
      lastApprovedAt: now.toISOString(),
    };
    await this.credentialRequestRepository.save(request);

    await this.credentialEventRepository.save(
      this.credentialEventRepository.create({
        createdById: adminUserId,
        credentialRequestId: request.id,
        actorId: adminUserId,
        eventType: CredentialEventType.APPROVED,
        note: 'Admin phe duyet cap chung chi',
        occurredAt: now,
        payload: {
          requestId: request.id,
          examAttemptId: attempt.id,
          totalScore,
          passThreshold,
        },
      }),
    );

    try {
      const vcId = `urn:uuid:${randomUUID()}`;
      const qrToken = randomUUID();
      const credentialPayload = this.buildCredentialPayload({
        vcId,
        requestId: request.id,
        issuedAt: now.toISOString(),
        totalScore,
        passThreshold,
        attemptId: attempt.id,
        user: {
          id: attempt.userId,
          name: attempt.user?.name ?? '',
          email: attempt.user?.email ?? '',
        },
        examTemplate: {
          id: attempt.examTemplateId,
          code: attempt.examTemplate?.code ?? '',
          name: attempt.examTemplate?.name ?? '',
        },
        template: resolvedTemplate,
      });

      const payloadHash = this.computePayloadHash(credentialPayload);
      const previousChainHash = await this.getLatestChainHash();
      const chainHash = this.hashSha256(
        `${previousChainHash ?? 'GENESIS'}|${payloadHash}|${request.id}|${now.toISOString()}`,
      );

      const ipfs = await this.uploadPayloadToIpfs(
        credentialPayload,
        `credential-${request.id}`,
      );

      const frontendBase =
        process.env.FRONTEND_BASE_URL?.trim() ||
        process.env.NEXT_PUBLIC_APP_URL?.trim() ||
        '';
      const qrUrl = frontendBase
        ? `${frontendBase.replace(/\/$/, '')}/verify/credential/${qrToken}`
        : null;

      const expiresAt =
        resolvedTemplate.validityDays && resolvedTemplate.validityDays > 0
          ? new Date(
              now.getTime() +
                resolvedTemplate.validityDays * 24 * 60 * 60 * 1000,
            )
          : null;

      const serialNumber = this.generateSerialNumber(now);
      const credential = await this.credentialRepository.save(
        this.credentialRepository.create({
          createdById: adminUserId,
          serialNumber,
          vcId,
          status: CredentialStatus.ISSUED,
          userId: request.userId,
          credentialTemplateId: resolvedTemplate.id,
          requestId: request.id,
          subjectDid: `did:${PROJECT_DID_NAMESPACE}:user:${request.userId}`,
          issuerDid: resolvedTemplate.issuerDid ?? null,
          storageUri: ipfs.storageUri,
          ipfsCid: ipfs.cid,
          qrToken,
          qrUrl,
          issuedAt: now,
          expiresAt,
          revokedAt: null,
          revokedById: null,
          revocationReason: null,
          credentialPayload,
          metadata: {
            issueSource: 'admin_dashboard',
            ipfsProvider: ipfs.provider,
            ipfsGatewayUrl: ipfs.gatewayUrl,
            integrityMode: 'off_chain_hash_chain',
            hashAlgorithm: 'sha256',
            payloadHash,
            previousChainHash,
            chainHash,
          },
        }),
      );

      request.status = CredentialRequestStatus.ISSUED;
      request.metadata = {
        ...(request.metadata ?? {}),
        issuedAt: now.toISOString(),
        credentialId: credential.id,
      };
      await this.credentialRequestRepository.save(request);

      await this.credentialEventRepository.save(
        this.credentialEventRepository.create({
          createdById: adminUserId,
          credentialId: credential.id,
          credentialRequestId: request.id,
          actorId: adminUserId,
          eventType: CredentialEventType.ISSUED,
          note: 'Da cap chung chi thanh cong',
          occurredAt: new Date(),
          payload: {
            credentialId: credential.id,
            serialNumber: credential.serialNumber,
            ipfsCid: credential.ipfsCid,
            storageUri: credential.storageUri,
            payloadHash,
            previousChainHash,
            chainHash,
          },
        }),
      );

      return {
        issued: true,
        alreadyIssued: false,
        credentialId: credential.id,
        serialNumber: credential.serialNumber,
        ipfsCid: credential.ipfsCid,
        storageUri: credential.storageUri,
        payloadHash,
        chainHash,
        issueStatus: 'issued',
      };
    } catch (error: any) {
      request.status = CredentialRequestStatus.FAILED;
      request.metadata = {
        ...(request.metadata ?? {}),
        failedAt: new Date().toISOString(),
        failedMessage: error?.message ?? 'Issue credential failed',
      };
      await this.credentialRequestRepository.save(request);

      await this.credentialEventRepository.save(
        this.credentialEventRepository.create({
          createdById: adminUserId,
          credentialRequestId: request.id,
          actorId: adminUserId,
          eventType: CredentialEventType.FAILED,
          note: 'Cap chung chi that bai',
          occurredAt: new Date(),
          payload: {
            error: error?.message ?? 'unknown_error',
            examAttemptId: attempt.id,
          },
        }),
      );

      throw new BadRequestException(
        error?.message ?? 'Khong the cap chung chi cho hoc vien',
      );
    }
  }

  private async findMatchingCredentialTemplate(totalScore: number) {
    return this.credentialTemplateRepository
      .createQueryBuilder('template')
      .where('template.status = :status', {
        status: CredentialTemplateStatus.PUBLISHED,
      })
      .andWhere(
        '(template.passScoreThreshold IS NULL OR template.passScoreThreshold <= :totalScore)',
        { totalScore },
      )
      .orderBy('COALESCE(template.passScoreThreshold, 0)', 'DESC')
      .addOrderBy('template.publishedAt', 'DESC', 'NULLS LAST')
      .addOrderBy('template.createdAt', 'DESC')
      .getOne();
  }

  private async ensureDefaultCredentialTemplate(adminUserId: string) {
    const latestPublished = await this.credentialTemplateRepository
      .createQueryBuilder('template')
      .where('template.status = :status', {
        status: CredentialTemplateStatus.PUBLISHED,
      })
      .orderBy('template.publishedAt', 'DESC', 'NULLS LAST')
      .addOrderBy('template.createdAt', 'DESC')
      .getOne();

    if (latestPublished) {
      return latestPublished;
    }

    const now = new Date();
    const code = `AUTO-CERT-${now.getFullYear()}${String(
      now.getMonth() + 1,
    ).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${randomUUID()
      .slice(0, 6)
      .toUpperCase()}`;

    return this.credentialTemplateRepository.save(
      this.credentialTemplateRepository.create({
        createdById: adminUserId,
        code,
        name: 'Mau chung chi mac dinh',
        title: `${PROJECT_BRAND_NAME} Official Certificate`,
        description:
          'Mau chung chi duoc tao tu dong khi he thong chua co template publish.',
        status: CredentialTemplateStatus.PUBLISHED,
        issuerName: PROJECT_BRAND_NAME,
        issuerDid: null,
        passScoreThreshold: APP_CONSTANTS.CERTIFICATE_PASS_THRESHOLD,
        validityDays: null,
        artworkStorageKey: null,
        artworkPublicUrl: null,
        templatePayload: {
          autoGenerated: true,
          version: 1,
        },
        publishedAt: now,
        metadata: {
          autoGenerated: true,
          source: 'admin_dashboard_issue_fallback',
        },
        updatedById: adminUserId,
      }),
    );
  }

  private async uploadPayloadToIpfs(
    payload: Record<string, unknown>,
    name: string,
  ): Promise<{
    provider: string;
    cid: string | null;
    storageUri: string | null;
    gatewayUrl: string | null;
  }> {
    const ipfsEnabled = process.env.IPFS_ENABLED === 'true';
    const provider = process.env.IPFS_PROVIDER || 'none';

    if (!ipfsEnabled) {
      return {
        provider,
        cid: null,
        storageUri: null,
        gatewayUrl: null,
      };
    }

    if (provider !== 'pinata') {
      throw new BadRequestException(
        `IPFS provider "${provider}" chua duoc ho tro`,
      );
    }

    const apiKey = process.env.PINATA_API_KEY;
    const secretKey = process.env.PINATA_SECRET_KEY;
    if (!apiKey || !secretKey) {
      throw new BadRequestException('Thieu PINATA_API_KEY/PINATA_SECRET_KEY');
    }

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        pinata_api_key: apiKey,
        pinata_secret_api_key: secretKey,
      },
      body: JSON.stringify({
        pinataMetadata: { name },
        pinataContent: payload,
      }),
    });

    const result = await response.json();
    if (!response.ok || !result?.IpfsHash) {
      const message =
        result?.error?.reason ||
        result?.message ||
        'Upload credential payload len IPFS that bai';
      throw new BadRequestException(message);
    }

    const cid = String(result.IpfsHash);
    const gatewayBase =
      process.env.PINATA_GATEWAY_URL?.trim() || 'https://gateway.pinata.cloud/ipfs';

    return {
      provider,
      cid,
      storageUri: `ipfs://${cid}`,
      gatewayUrl: `${gatewayBase.replace(/\/$/, '')}/${cid}`,
    };
  }

  private async getLatestChainHash(): Promise<string | null> {
    const latestIssued = await this.credentialRepository
      .createQueryBuilder('credential')
      .select(['credential.id', 'credential.metadata', 'credential.issuedAt'])
      .where('credential.status = :status', {
        status: CredentialStatus.ISSUED,
      })
      .orderBy('credential.issuedAt', 'DESC')
      .addOrderBy('credential.createdAt', 'DESC')
      .limit(1)
      .getOne();

    const value = latestIssued?.metadata?.chainHash;
    return typeof value === 'string' && value.length > 0 ? value : null;
  }

  private computePayloadHash(payload: Record<string, unknown>): string {
    return this.hashSha256(this.stableStringify(payload));
  }

  private hashSha256(input: string): string {
    return createHash('sha256').update(input).digest('hex');
  }

  private stableStringify(value: unknown): string {
    if (value === null || typeof value !== 'object') {
      return JSON.stringify(value);
    }

    if (Array.isArray(value)) {
      return `[${value.map((item) => this.stableStringify(item)).join(',')}]`;
    }

    const objectValue = value as Record<string, unknown>;
    const keys = Object.keys(objectValue).sort();
    const body = keys
      .map((key) => `${JSON.stringify(key)}:${this.stableStringify(objectValue[key])}`)
      .join(',');
    return `{${body}}`;
  }

  private generateSerialNumber(now: Date): string {
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const suffix = randomUUID().slice(0, 8).toUpperCase();
    return `TOEIC-${yyyy}${mm}${dd}-${suffix}`;
  }

  private buildCredentialPayload(input: {
    vcId: string;
    requestId: string;
    issuedAt: string;
    totalScore: number;
    passThreshold: number;
    attemptId: string;
    user: { id: string; name: string; email: string };
    examTemplate: { id: string; code: string; name: string };
    template: CredentialTemplate;
  }): Record<string, unknown> {
    return {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://schema.org',
      ],
      id: input.vcId,
      type: ['VerifiableCredential', 'ToeicCertificate'],
      issuer: {
        id: input.template.issuerDid || `did:${PROJECT_DID_NAMESPACE}:issuer:default`,
        name: PROJECT_BRAND_NAME,
      },
      issuanceDate: input.issuedAt,
      credentialSubject: {
        id: `did:${PROJECT_DID_NAMESPACE}:user:${input.user.id}`,
        learnerId: input.user.id,
        learnerName: input.user.name,
        learnerEmail: input.user.email,
        score: input.totalScore,
        passThreshold: input.passThreshold,
        passed: input.totalScore > input.passThreshold,
        examAttemptId: input.attemptId,
        examTemplate: {
          id: input.examTemplate.id,
          code: input.examTemplate.code,
          name: input.examTemplate.name,
        },
        certificateTemplate: {
          id: input.template.id,
          code: input.template.code,
          name: input.template.name,
          title: `${PROJECT_BRAND_NAME} Official Certificate`,
        },
      },
      proof: null,
      metadata: {
        requestId: input.requestId,
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
