// src/proctoring/proctoring.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProctoringService } from './proctoring.service';
import { ProctoringController } from './proctoring.controller';
import { ProctoringGateway } from './proctoring.gateway';
import { ViolationConsumer } from './violation.consumer';
import { ProctoringViolation } from '@modules/assessment/exam-attempt/entities/proctoring-violation.entity';
import { ExamAttempt } from '@modules/assessment/exam-attempt/entities/exam-attempt.entity';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProctoringViolation, ExamAttempt]),
    RedisModule,
  ],
  controllers: [ProctoringController],
  providers: [ProctoringService, ProctoringGateway, ViolationConsumer],
  exports: [ProctoringService, ProctoringGateway],
})
export class ProctoringModule {}
