// src/proctoring/violation.consumer.ts
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
} from '@nestjs/common';
import { Redis } from 'ioredis';
import { ProctoringService } from './proctoring.service';

@Injectable()
export class ViolationConsumer implements OnModuleInit, OnModuleDestroy {
  private isRunning = true;

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly proctoringService: ProctoringService,
  ) {}

  async onModuleInit() {
    console.log('Violation consumer started');
    this.processViolations();
  }

  async onModuleDestroy() {
    this.isRunning = false;
    console.log('Violation consumer stopped');
  }

  private async processViolations() {
    while (this.isRunning) {
      try {
        const result = await this.redis.brpop('violation_queue', 1);
        if (result) {
          const [, data] = result;
          const violation = JSON.parse(data);
          await this.proctoringService.handleViolation(violation);
        }
      } catch (error) {
        console.error('Error processing violation:', error);
      }
    }
  }
}
