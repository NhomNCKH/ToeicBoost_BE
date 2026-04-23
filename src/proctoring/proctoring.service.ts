import { Injectable, Inject, Logger } from '@nestjs/common';
import { ExamAttemptStatus } from '@common/constants/assessment.enum';
import { ExamAttempt } from '@modules/assessment/exam-attempt/entities/exam-attempt.entity';
import { ProctoringViolation } from '@modules/assessment/exam-attempt/entities/proctoring-violation.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Redis } from 'ioredis';
import { In, Repository } from 'typeorm';

interface ViolationDetail {
  action?: string;
  message?: string;
  severity?: number;
  confidence?: number;
  timestamp?: string;
}

interface ProctoringPayload {
  userId: string;
  examId?: string;
  examAttemptId?: string;
  violations: ViolationDetail[];
}

@Injectable()
export class ProctoringService {
  private readonly logger = new Logger(ProctoringService.name);

  constructor(
    @InjectRepository(ExamAttempt)
    private readonly examAttemptRepository: Repository<ExamAttempt>,
    @InjectRepository(ProctoringViolation)
    private readonly violationRepository: Repository<ProctoringViolation>,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
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
          violationType: violation.action ?? 'unknown',
          message: violation.message,
          severity: violation.severity ?? 1,
          confidence: violation.confidence ?? 0,
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
  ): Promise<{ data: ProctoringViolation[]; total: number }> {
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

    return { data, total };
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
}
