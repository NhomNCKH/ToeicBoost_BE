import { Injectable, Logger, Inject, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';

/**
 * Real-time notification service for proctoring events.
 * Uses Redis pub/sub to handle warnings and blocked exam notifications.
 * Frontend can subscribe to these events or poll the violations endpoint.
 */
@Injectable()
export class ProctoringGateway implements OnModuleDestroy {
  private readonly logger = new Logger(ProctoringGateway.name);
  private redisSubscriber: Redis;
  private messageHandlers: Map<string, (data: any) => void> = new Map();

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async onModuleInit() {
    this.logger.log('Proctoring notification service initialized');
    this.setupRedisSubscription();
  }

  private setupRedisSubscription() {
    this.redisSubscriber = this.redis.duplicate();

    this.redisSubscriber.subscribe('exam:warning', (err) => {
      if (err) {
        this.logger.error('Redis subscription error (exam:warning):', err);
      } else {
        this.logger.debug('Subscribed to exam:warning channel');
      }
    });

    this.redisSubscriber.subscribe('exam:blocked', (err) => {
      if (err) {
        this.logger.error('Redis subscription error (exam:blocked):', err);
      } else {
        this.logger.debug('Subscribed to exam:blocked channel');
      }
    });

    this.redisSubscriber.on('message', (channel, messageStr) => {
      try {
        const message = JSON.parse(messageStr);

        if (channel === 'exam:warning') {
          this.logger.debug(
            `Warning received: user=${message.userId}, exam=${message.examId}, count=${message.count}`,
          );
          const handler = this.messageHandlers.get(
            `warning:${message.userId}:${message.examId}`,
          );
          if (handler) {
            handler(message);
          }
        } else if (channel === 'exam:blocked') {
          this.logger.warn(
            `Exam blocked: user=${message.userId}, exam=${message.examId}`,
          );
          const handler = this.messageHandlers.get(
            `blocked:${message.userId}:${message.examId}`,
          );
          if (handler) {
            handler(message);
          }
        }
      } catch (error) {
        this.logger.error(
          `Error processing Redis message on ${channel}:`,
          error,
        );
      }
    });
  }

  /**
   * Register a handler for warning events (can be used for logging, metrics, etc.)
   */
  onWarning(userId: string, examId: string, handler: (data: any) => void) {
    this.messageHandlers.set(`warning:${userId}:${examId}`, handler);
  }

  /**
   * Register a handler for blocked events (can be used for logging, metrics, etc.)
   */
  onBlocked(userId: string, examId: string, handler: (data: any) => void) {
    this.messageHandlers.set(`blocked:${userId}:${examId}`, handler);
  }

  onModuleDestroy() {
    if (this.redisSubscriber) {
      this.redisSubscriber.disconnect();
    }
  }
}
