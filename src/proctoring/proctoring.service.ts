import { Injectable, Inject, Logger } from '@nestjs/common';
import { ExamAttemptStatus } from '@common/constants/assessment.enum';
import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExamAttempt } from '@modules/assessment/exam-attempt/entities/exam-attempt.entity';
import { ProctoringViolation } from '@modules/assessment/exam-attempt/entities/proctoring-violation.entity';
import {
  OfficialExamRegistration,
  OfficialExamRegistrationStatus,
} from '@modules/assessment/official-exam/entities/official-exam-registration.entity';
import { S3StorageService } from '@modules/s3/s3-storage.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Redis } from 'ioredis';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import { LogProctoringEventDto } from './dto/log-proctoring-event.dto';
import { VerifyFaceIdentityDto } from './dto/verify-face-identity.dto';

interface ViolationDetail {
  action?: string;
  message?: string;
  severity?: number;
  confidence?: number;
  timestamp?: string;
  snapshotImage?: string;
  screenshotUrl?: string;
}

interface ProctoringPayload {
  userId: string;
  examId?: string;
  examAttemptId?: string;
  violations: ViolationDetail[];
}

interface FaceDiagnostics {
  detection_score: number;
  bbox: number[];
}

interface FaceVerificationServiceResponse {
  verified: boolean;
  same_person: boolean;
  similarity: number;
  threshold: number;
  official_face: FaceDiagnostics;
  webcam_face: FaceDiagnostics;
}

interface ProctoringDebugEvent {
  userId: string;
  examId: string;
  examAttemptId: string | null;
  source: string;
  event: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

@Injectable()
export class ProctoringService {
  private readonly logger = new Logger(ProctoringService.name);

  constructor(
    @InjectRepository(ExamAttempt)
    private readonly examAttemptRepository: Repository<ExamAttempt>,
    @InjectRepository(ProctoringViolation)
    private readonly violationRepository: Repository<ProctoringViolation>,
    @InjectRepository(OfficialExamRegistration)
    private readonly registrationRepository: Repository<OfficialExamRegistration>,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly s3StorageService: S3StorageService,
    private readonly configService: ConfigService,
  ) {}

  async handleViolation(data: unknown): Promise<void> {
    const payload = this.normalizePayload(data);

    if (!payload) {
      this.logger.warn('Invalid violation payload');
      return;
    }

    if (payload.violations.length === 0) {
      return;
    }

    const context = await this.resolveAttemptContext(
      payload.userId,
      payload.examId,
      payload.examAttemptId,
    );

    const canonicalExamId =
      context.attempt?.id ?? payload.examAttemptId ?? payload.examId;

    if (!canonicalExamId) {
      this.logger.warn(
        `Cannot handle violation: missing exam identifier for user=${payload.userId}`,
      );
      return;
    }

    await Promise.all(
      payload.violations.map((violation) =>
        this.violationRepository.save({
          userId: payload.userId,
          examId: canonicalExamId,
          examAttemptId: context.attempt?.id ?? payload.examAttemptId ?? null,
          violationType: violation.action ?? 'unknown',
          message: violation.message,
          severity: violation.severity ?? 1,
          confidence: violation.confidence ?? 0,
          screenshotUrl: violation.screenshotUrl ?? violation.snapshotImage ?? null,
          timestamp: violation.timestamp
            ? new Date(violation.timestamp)
            : new Date(),
        }),
      ),
    );

    const counterScope = context.attempt?.id ?? canonicalExamId;
    const violationKey = `proctoring:violation-count:${payload.userId}:${counterScope}`;
    const incrementBy = payload.violations.length;
    const count = await this.redis.incrby(violationKey, incrementBy);

    if (count === incrementBy) {
      await this.redis.expire(violationKey, 5 * 60);
    }

    const previousCount = count - incrementBy;
    const latestViolation = payload.violations[0];

    await this.recordDebugLog({
      userId: payload.userId,
      examId: canonicalExamId,
      examAttemptId: context.attempt?.id ?? payload.examAttemptId ?? null,
      source: 'backend',
      event: 'violation_received',
      level: 'warn',
      message: 'Backend received proctoring violation report',
      metadata: {
        violationCount: payload.violations.length,
        warningCount: count,
        action: latestViolation?.action ?? 'unknown',
        severity: latestViolation?.severity ?? 0,
        confidence: latestViolation?.confidence ?? 0,
      },
      timestamp: new Date().toISOString(),
    });

    this.logger.warn(
      `Violation detected: user=${payload.userId}, exam=${canonicalExamId}, count=${count}, action=${latestViolation?.action ?? 'unknown'}, severity=${latestViolation?.severity ?? 0}`,
    );

    if (count >= 5) {
      await this.blockUser(payload.userId, canonicalExamId, context.attempt, count);
      return;
    }

    if (previousCount < 3 && count >= 3) {
      await this.sendWarning(
        payload.userId,
        canonicalExamId,
        context.attempt?.id,
        count,
        latestViolation,
      );
    }

    if (context.attempt) {
      context.attempt.violationCount =
        (context.attempt.violationCount ?? 0) + incrementBy;
      context.attempt.lastViolationAt = new Date();

      if (previousCount < 3 && count >= 3) {
        context.attempt.warningCount = (context.attempt.warningCount ?? 0) + 1;
      }

      await this.examAttemptRepository.save(context.attempt);
    }
  }

  async verifyFaceIdentity(userId: string, dto: VerifyFaceIdentityDto) {
    if (!dto.examTemplateId && !dto.examAttemptId) {
      throw new BadRequestException(
        'examTemplateId or examAttemptId is required',
      );
    }

    const attempt = await this.resolveFaceVerificationAttempt(userId, dto);
    const examTemplateId = dto.examTemplateId ?? attempt?.examTemplateId;

    if (!examTemplateId) {
      throw new BadRequestException('Cannot resolve exam template');
    }

    await this.recordDebugLog({
      userId,
      examId: attempt?.id ?? examTemplateId,
      examAttemptId: attempt?.id ?? dto.examAttemptId ?? null,
      source: 'backend',
      event: 'face_verification_started',
      level: 'info',
      message: 'Starting face verification checkpoint',
      metadata: {
        checkpoint: dto.checkpoint?.trim() || 'manual_check',
        examTemplateId,
      },
      timestamp: new Date().toISOString(),
    });

    if (
      attempt &&
      dto.examTemplateId &&
      attempt.examTemplateId !== dto.examTemplateId
    ) {
      throw new BadRequestException(
        'examTemplateId does not match examAttemptId',
      );
    }

    const registration = await this.registrationRepository.findOne({
      where: {
        userId,
        examTemplateId,
        status: OfficialExamRegistrationStatus.REGISTERED,
      },
    });

    if (!registration) {
      throw new BadRequestException(
        'No active official exam registration found for this exam',
      );
    }

    const officialImageBase64 =
      await this.loadOfficialRegistrationImageBase64(registration);

    const verification = await this.callFaceVerificationService({
      officialImageBase64,
      webcamImageBase64: dto.webcamImageBase64,
    });

    const checkedAt = new Date().toISOString();
    const audit = {
      checkpoint: dto.checkpoint?.trim() || 'manual_check',
      verified: verification.verified,
      similarity: verification.similarity,
      threshold: verification.threshold,
      checkedAt,
    };

    await this.persistFaceVerificationAudit(registration, attempt, audit);

    await this.recordDebugLog({
      userId,
      examId: attempt?.id ?? examTemplateId,
      examAttemptId: attempt?.id ?? dto.examAttemptId ?? null,
      source: 'face-verification',
      event: verification.verified
        ? 'face_verification_passed'
        : 'face_verification_failed',
      level: verification.verified ? 'info' : 'warn',
      message: verification.verified
        ? 'Webcam face matched official registration image'
        : 'Webcam face did not match official registration image',
      metadata: {
        checkpoint: audit.checkpoint,
        similarity: verification.similarity,
        threshold: verification.threshold,
        officialDetectionScore: verification.official_face?.detection_score,
        webcamDetectionScore: verification.webcam_face?.detection_score,
      },
      timestamp: checkedAt,
    });

    if (!verification.verified) {
      await this.handleViolation({
        user_id: userId,
        exam_id: examTemplateId,
        exam_attempt_id: attempt?.id ?? dto.examAttemptId,
        violations: [
          {
            action: 'face_mismatch',
            message:
              'Webcam face does not match the official registration image',
            severity: 5,
            confidence: this.toMismatchConfidence(verification.similarity),
            timestamp: checkedAt,
            screenshotUrl: dto.webcamSnapshotUrl,
          },
        ],
      });
    }

    return {
      userId,
      examTemplateId,
      examAttemptId: attempt?.id ?? null,
      checkpoint: audit.checkpoint,
      verified: verification.verified,
      allowedToStart: verification.verified,
      similarity: verification.similarity,
      threshold: verification.threshold,
      officialFace: verification.official_face,
      webcamFace: verification.webcam_face,
      checkedAt,
    };
  }

  async getStatus(userId: string, examIdentifier: string) {
    const examIds = await this.resolveExamIdentifiers(userId, examIdentifier);
    const [recentViolations, violationCount] = await this.violationRepository.findAndCount({
      where: {
        userId,
        examId: In(examIds),
      },
      order: { timestamp: 'DESC' },
      take: 5,
    });

    const context = await this.resolveAttemptContext(userId, examIdentifier, examIdentifier);

    return {
      userId,
      examId: context.attempt?.id ?? examIdentifier,
      examAttemptId: context.attempt?.id ?? null,
      examTemplateId: context.attempt?.examTemplateId ?? null,
      status: context.attempt?.proctoringStatus ?? 'active',
      violationCount,
      recentViolations,
    };
  }

  async getViolationHistoryPaginated(
    userId: string,
    examIdentifier: string,
    limit: number,
    offset: number,
  ): Promise<{ data: Array<ProctoringViolation & Record<string, unknown>>; total: number }> {
    const examIds = await this.resolveExamIdentifiers(userId, examIdentifier);

    const [data, total] = await this.violationRepository.findAndCount({
      where: {
        userId,
        examId: In(examIds),
      },
      order: { timestamp: 'DESC' },
      skip: offset,
      take: limit,
    });

    return { data: await this.enrichViolations(data), total };
  }

  async listViolationHistoryPaginated(
    limit: number,
    offset: number,
    filters?: { userId?: string; examId?: string },
  ): Promise<{ data: Array<ProctoringViolation & Record<string, unknown>>; total: number }> {
    const where: FindOptionsWhere<ProctoringViolation> = {};

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.examId) {
      where.examId = filters.examId;
    }

    const [data, total] = await this.violationRepository.findAndCount({
      where,
      order: { timestamp: 'DESC' },
      skip: offset,
      take: limit,
    });

    return { data: await this.enrichViolations(data), total };
  }

  async deleteViolation(id: string): Promise<void> {
    const violation = await this.violationRepository.findOne({ where: { id } });

    if (!violation) {
      throw new NotFoundException('Proctoring violation not found');
    }

    await this.violationRepository.delete(id);

    if (violation.examAttemptId) {
      await this.syncAttemptViolationStats(violation.examAttemptId);
    }
  }

  async logDebugEvent(userId: string, dto: LogProctoringEventDto) {
    if (!dto.examId && !dto.examAttemptId) {
      throw new BadRequestException('examId or examAttemptId is required');
    }

    const context = await this.resolveAttemptContext(
      userId,
      dto.examId,
      dto.examAttemptId,
    );

    const canonicalExamId =
      context.attempt?.id ?? dto.examAttemptId ?? dto.examId;

    if (!canonicalExamId) {
      throw new BadRequestException('Cannot resolve exam identifier');
    }

    await this.recordDebugLog({
      userId,
      examId: canonicalExamId,
      examAttemptId: context.attempt?.id ?? dto.examAttemptId ?? null,
      source: dto.source,
      event: dto.event,
      level: dto.level ?? 'debug',
      message: dto.message,
      metadata: dto.metadata,
      timestamp: dto.timestamp ?? new Date().toISOString(),
    });
  }

  async getDebugLogs(
    userId: string,
    examIdentifier: string,
    limit: number,
  ): Promise<{ key: string; total: number; data: ProctoringDebugEvent[] }> {
    const context = await this.resolveAttemptContext(
      userId,
      examIdentifier,
      examIdentifier,
    );
    const canonicalExamId = context.attempt?.id ?? examIdentifier;
    const key = this.getDebugLogKey(userId, canonicalExamId);
    const rows = await this.redis.lrange(key, 0, Math.max(limit - 1, 0));

    return {
      key,
      total: rows.length,
      data: rows
        .map((item) => this.safeParseDebugLog(item))
        .filter((item): item is ProctoringDebugEvent => Boolean(item)),
    };
  }

  private async enrichViolations(violations: ProctoringViolation[]) {
    if (!violations.length) {
      return [];
    }

    const attemptIds = Array.from(
      new Set(
        violations
          .flatMap((item) => [item.examAttemptId, item.examId])
          .filter((id): id is string => Boolean(id)),
      ),
    );

    const attempts = attemptIds.length
      ? await this.examAttemptRepository.find({
          where: { id: In(attemptIds) },
          relations: { user: true, examTemplate: true },
        })
      : [];

    const attemptById = new Map(attempts.map((attempt) => [attempt.id, attempt]));

    return violations.map((violation) => {
      const attempt =
        (violation.examAttemptId
          ? attemptById.get(violation.examAttemptId)
          : undefined) ??
        attemptById.get(violation.examId);
      const snapshotTemplate = attempt?.templateSnapshot?.template as
        | Record<string, unknown>
        | undefined;

      return {
        ...violation,
        userName: attempt?.user?.name ?? null,
        userEmail: attempt?.user?.email ?? null,
        examName:
          attempt?.examTemplate?.name ??
          (typeof snapshotTemplate?.name === 'string' ? snapshotTemplate.name : null),
        examCode:
          attempt?.examTemplate?.code ??
          (typeof snapshotTemplate?.code === 'string' ? snapshotTemplate.code : null),
      };
    });
  }

  private async syncAttemptViolationStats(examAttemptId: string): Promise<void> {
    const [latestViolation, violationCount] =
      await this.violationRepository.findAndCount({
        where: { examAttemptId },
        order: { timestamp: 'DESC' },
        take: 1,
      });

    await this.examAttemptRepository.update(examAttemptId, {
      violationCount,
      lastViolationAt: latestViolation[0]?.timestamp ?? null,
    });
  }

  private async resolveFaceVerificationAttempt(
    userId: string,
    dto: VerifyFaceIdentityDto,
  ) {
    if (dto.examAttemptId) {
      const attempt = await this.examAttemptRepository.findOne({
        where: { id: dto.examAttemptId, userId },
      });

      if (!attempt) {
        throw new NotFoundException('Exam attempt not found');
      }

      return attempt;
    }

    if (!dto.examTemplateId) {
      return null;
    }

    return this.examAttemptRepository.findOne({
      where: {
        userId,
        examTemplateId: dto.examTemplateId,
        status: ExamAttemptStatus.IN_PROGRESS,
      },
      order: { createdAt: 'DESC' },
    });
  }

  private async loadOfficialRegistrationImageBase64(
    registration: OfficialExamRegistration,
  ) {
    const profile = this.getCertificateProfile(registration);
    const avatarS3Key =
      this.readString(profile.avatarS3Key) ??
      this.deriveS3KeyFromAvatarUrl(this.readString(profile.avatarUrl));
    const avatarUrl = this.readString(profile.avatarUrl);

    let buffer: Buffer;

    if (avatarS3Key) {
      buffer = await this.s3StorageService.getObjectBuffer({
        objectKey: avatarS3Key,
      });
    } else if (avatarUrl) {
      buffer = await this.fetchImageBuffer(avatarUrl);
    } else {
      throw new BadRequestException(
        'Official exam registration does not have an official image',
      );
    }

    if (buffer.length === 0) {
      throw new BadRequestException('Official registration image is empty');
    }

    if (buffer.length > this.getMaxFaceImageBytes()) {
      throw new BadRequestException('Official registration image is too large');
    }

    return buffer.toString('base64');
  }

  private getCertificateProfile(registration: OfficialExamRegistration) {
    const metadata = registration.metadata ?? {};
    const profile = (metadata as Record<string, unknown>).certificateProfile;

    return profile && typeof profile === 'object'
      ? (profile as Record<string, unknown>)
      : {};
  }

  private async fetchImageBuffer(url: string) {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.getFaceVerificationTimeoutMs(),
    );

    try {
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        throw new BadRequestException(
          `Cannot fetch official image: HTTP ${response.status}`,
        );
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (contentType && !contentType.startsWith('image/')) {
        throw new BadRequestException('Official image URL is not an image');
      }

      const body = Buffer.from(await response.arrayBuffer());
      if (body.length > this.getMaxFaceImageBytes()) {
        throw new BadRequestException('Official registration image is too large');
      }

      return body;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Cannot fetch official registration image');
    } finally {
      clearTimeout(timeout);
    }
  }

  private async callFaceVerificationService(params: {
    officialImageBase64: string;
    webcamImageBase64: string;
  }): Promise<FaceVerificationServiceResponse> {
    const baseUrl = this.getFaceVerificationServiceUrl();
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.getFaceVerificationTimeoutMs(),
    );

    try {
      const response = await fetch(`${baseUrl}/api/verify-base64`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          official_image_base64: params.officialImageBase64,
          webcam_image_base64: params.webcamImageBase64,
        }),
        signal: controller.signal,
      });

      const payload = await this.parseJsonResponse(response);

      if (!response.ok) {
        throw new BadRequestException(
          this.readString(payload.detail) ??
            this.readString(payload.message) ??
            'Face verification failed',
        );
      }

      return payload as unknown as FaceVerificationServiceResponse;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new ServiceUnavailableException(
        'Face verification service is unavailable',
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private async parseJsonResponse(response: Response) {
    const text = await response.text();

    if (!text) {
      return {};
    }

    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      return { message: text };
    }
  }

  private async persistFaceVerificationAudit(
    registration: OfficialExamRegistration,
    attempt: ExamAttempt | null,
    audit: Record<string, unknown>,
  ) {
    const registrationMetadata = registration.metadata ?? {};
    const previousChecks = Array.isArray(
      (registrationMetadata as Record<string, unknown>).faceVerificationChecks,
    )
      ? ((registrationMetadata as Record<string, unknown>)
          .faceVerificationChecks as unknown[])
      : [];

    await this.registrationRepository.update(registration.id, {
      metadata: {
        ...registrationMetadata,
        lastFaceVerification: audit,
        faceVerificationChecks: [...previousChecks.slice(-9), audit],
      },
    });

    if (attempt) {
      await this.examAttemptRepository.update(attempt.id, {
        metadata: {
          ...(attempt.metadata ?? {}),
          lastFaceVerification: audit,
        },
      });
    }
  }

  private deriveS3KeyFromAvatarUrl(avatarUrl?: string) {
    if (!avatarUrl) {
      return undefined;
    }

    if (avatarUrl.startsWith('avatars/')) {
      return avatarUrl;
    }

    try {
      const url = new URL(avatarUrl);
      const pathname = decodeURIComponent(url.pathname || '').replace(/^\/+/, '');
      return pathname.startsWith('avatars/') ? pathname : undefined;
    } catch {
      return undefined;
    }
  }

  private getFaceVerificationServiceUrl() {
    return (
      this.configService.get<string>('FACE_VERIFICATION_SERVICE_URL')?.trim() ||
      'http://localhost:8002'
    ).replace(/\/$/, '');
  }

  private getFaceVerificationTimeoutMs() {
    const raw = Number(
      this.configService.get<string>('FACE_VERIFICATION_REQUEST_TIMEOUT_MS'),
    );

    return Number.isFinite(raw) && raw > 0 ? raw : 15_000;
  }

  private getMaxFaceImageBytes() {
    const raw = Number(
      this.configService.get<string>('FACE_VERIFICATION_MAX_IMAGE_BYTES'),
    );

    return Number.isFinite(raw) && raw > 0 ? raw : 5 * 1024 * 1024;
  }

  private toMismatchConfidence(similarity: number) {
    return Number(Math.min(Math.max(1 - similarity, 0), 1).toFixed(4));
  }

  private normalizePayload(data: unknown): ProctoringPayload | null {
    if (!data || typeof data !== 'object') {
      return null;
    }

    const payload = data as Record<string, unknown>;
    const userId = this.readString(payload.userId) ?? this.readString(payload.user_id);
    const examId = this.readString(payload.examId) ?? this.readString(payload.exam_id);
    const examAttemptId =
      this.readString(payload.examAttemptId) ??
      this.readString(payload.exam_attempt_id);

    const violationsRaw = Array.isArray(payload.violations)
      ? payload.violations
      : [];

    const violations = violationsRaw
      .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
      .map((item) => ({
        action: this.readString(item.action),
        message: this.readString(item.message),
        severity: this.readNumber(item.severity),
        confidence: this.readNumber(item.confidence),
        timestamp: this.readString(item.timestamp),
        snapshotImage: this.readString(item.snapshotImage),
        screenshotUrl: this.readString(item.screenshotUrl),
      }));

    if (!userId || (!examId && !examAttemptId)) {
      return null;
    }

    return {
      userId,
      examId,
      examAttemptId,
      violations,
    };
  }

  private async blockUser(
    userId: string,
    examId: string,
    attempt: ExamAttempt | null,
    violationCount: number,
  ): Promise<void> {
    const targetAttempt = attempt ?? (await this.examAttemptRepository.findOne({
      where: {
        userId,
        status: ExamAttemptStatus.IN_PROGRESS,
      },
      order: { createdAt: 'DESC' },
    }));

    if (targetAttempt) {
      targetAttempt.status = ExamAttemptStatus.CANCELLED;
      targetAttempt.blockedAt = new Date();
      targetAttempt.blockReason = `Quá số lần vi phạm cho phép (${violationCount} lần/5 phút)`;
      targetAttempt.proctoringStatus = 'blocked';
      await this.examAttemptRepository.save(targetAttempt);
    } else {
      this.logger.warn(
        `No in-progress attempt found to block: user=${userId}, exam=${examId}`,
      );
    }

    await this.redis.publish(
      'exam:blocked',
      JSON.stringify({
        userId,
        examId,
        examAttemptId: targetAttempt?.id ?? null,
        reason: 'Bạn đã bị đình chỉ thi do vi phạm quy chế nhiều lần',
      }),
    );

    this.logger.warn(`Blocked exam attempt: user=${userId}, exam=${examId}`);

    await this.recordDebugLog({
      userId,
      examId,
      examAttemptId: targetAttempt?.id ?? null,
      source: 'backend',
      event: 'exam_blocked',
      level: 'error',
      message: 'Exam attempt was blocked by proctoring policy',
      metadata: {
        violationCount,
        reason: targetAttempt?.blockReason ?? null,
      },
      timestamp: new Date().toISOString(),
    });
  }

  private async sendWarning(
    userId: string,
    examId: string,
    examAttemptId: string | undefined,
    count: number,
    latestViolation?: ViolationDetail,
  ): Promise<void> {
    const warningLevel = count - 2;
    const warningMessage =
      warningLevel === 1
        ? `Cảnh báo lần 1: Phát hiện hành vi ${latestViolation?.action ?? 'đáng ngờ'}.`
        : `Cảnh báo lần ${warningLevel}: Tiếp tục vi phạm sẽ bị đình chỉ thi.`;

    await this.redis.publish(
      'exam:warning',
      JSON.stringify({
        userId,
        examId,
        examAttemptId: examAttemptId ?? null,
        count: warningLevel,
        message: warningMessage,
        violation: latestViolation ?? null,
      }),
    );

    this.logger.warn(`Warning sent: user=${userId}, exam=${examId}, count=${count}`);

    await this.recordDebugLog({
      userId,
      examId,
      examAttemptId: examAttemptId ?? null,
      source: 'backend',
      event: 'warning_sent',
      level: 'warn',
      message: warningMessage,
      metadata: {
        count,
        action: latestViolation?.action ?? null,
        severity: latestViolation?.severity ?? null,
      },
      timestamp: new Date().toISOString(),
    });
  }

  private async resolveAttemptContext(
    userId: string,
    examId?: string,
    examAttemptId?: string,
  ): Promise<{ attempt: ExamAttempt | null }> {
    if (examAttemptId) {
      const byAttempt = await this.examAttemptRepository.findOne({
        where: { id: examAttemptId, userId },
      });

      if (byAttempt) {
        return { attempt: byAttempt };
      }
    }

    if (examId) {
      const byId = await this.examAttemptRepository.findOne({
        where: { id: examId, userId },
      });

      if (byId) {
        return { attempt: byId };
      }

      const byTemplate = await this.examAttemptRepository.findOne({
        where: {
          userId,
          examTemplateId: examId,
          status: ExamAttemptStatus.IN_PROGRESS,
        },
        order: { createdAt: 'DESC' },
      });

      if (byTemplate) {
        return { attempt: byTemplate };
      }
    }

    return { attempt: null };
  }

  private async resolveExamIdentifiers(
    userId: string,
    examIdentifier: string,
  ): Promise<string[]> {
    const ids = new Set<string>([examIdentifier]);

    const byAttempt = await this.examAttemptRepository.findOne({
      where: { id: examIdentifier, userId },
    });

    if (byAttempt) {
      ids.add(byAttempt.examTemplateId);
      ids.add(byAttempt.id);
      return Array.from(ids);
    }

    const byTemplate = await this.examAttemptRepository.findOne({
      where: {
        userId,
        examTemplateId: examIdentifier,
      },
      order: { createdAt: 'DESC' },
    });

    if (byTemplate) {
      ids.add(byTemplate.id);
      ids.add(byTemplate.examTemplateId);
    }

    return Array.from(ids);
  }

  private readString(value: unknown): string | undefined {
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  }

  private readNumber(value: unknown): number | undefined {
    return typeof value === 'number' ? value : undefined;
  }

  private async recordDebugLog(event: ProctoringDebugEvent): Promise<void> {
    const sanitizedEvent: ProctoringDebugEvent = {
      ...event,
      source: event.source.slice(0, 40),
      event: event.event.slice(0, 80),
      message: event.message?.slice(0, 500),
      metadata: this.sanitizeDebugMetadata(event.metadata),
    };

    const key = this.getDebugLogKey(event.userId, event.examId);
    const maxEntries = this.getDebugLogMaxEntries();

    await this.redis.lpush(key, JSON.stringify(sanitizedEvent));
    await this.redis.ltrim(key, 0, maxEntries - 1);
    await this.redis.expire(key, this.getDebugLogTtlSeconds());

    const summary = `${sanitizedEvent.event} user=${event.userId} exam=${event.examId}`;
    if (sanitizedEvent.level === 'error') {
      this.logger.error(summary);
    } else if (sanitizedEvent.level === 'warn') {
      this.logger.warn(summary);
    } else if (sanitizedEvent.level === 'debug') {
      this.logger.debug(summary);
    } else {
      this.logger.log(summary);
    }
  }

  private getDebugLogKey(userId: string, examId: string): string {
    return `proctoring:debug-logs:${userId}:${examId}`;
  }

  private safeParseDebugLog(raw: string): ProctoringDebugEvent | null {
    try {
      return JSON.parse(raw) as ProctoringDebugEvent;
    } catch {
      return null;
    }
  }

  private sanitizeDebugMetadata(value: unknown, depth = 0): Record<string, unknown> | undefined {
    if (!value || typeof value !== 'object' || depth > 2) {
      return undefined;
    }

    const result: Record<string, unknown> = {};
    const source = value as Record<string, unknown>;

    for (const [key, raw] of Object.entries(source)) {
      const normalizedKey = key.toLowerCase();
      if (
        normalizedKey.includes('image') ||
        normalizedKey.includes('base64') ||
        normalizedKey.includes('snapshot')
      ) {
        result[key] = '[omitted]';
        continue;
      }

      if (typeof raw === 'string') {
        result[key] = raw.length > 300 ? `${raw.slice(0, 300)}...` : raw;
      } else if (typeof raw === 'number' || typeof raw === 'boolean' || raw === null) {
        result[key] = raw;
      } else if (Array.isArray(raw)) {
        result[key] = raw.slice(0, 20);
      } else if (raw && typeof raw === 'object') {
        result[key] = this.sanitizeDebugMetadata(raw, depth + 1) ?? {};
      }
    }

    return result;
  }

  private getDebugLogMaxEntries(): number {
    const raw = Number(
      this.configService.get<string>('PROCTORING_DEBUG_LOG_MAX_ENTRIES'),
    );

    return Number.isFinite(raw) && raw > 0 ? Math.min(raw, 1000) : 300;
  }

  private getDebugLogTtlSeconds(): number {
    const raw = Number(
      this.configService.get<string>('PROCTORING_DEBUG_LOG_TTL_SECONDS'),
    );

    return Number.isFinite(raw) && raw > 0 ? raw : 24 * 60 * 60;
  }
}
