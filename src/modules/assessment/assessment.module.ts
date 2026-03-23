import { Module } from '@nestjs/common';
import { ExamAttemptModule } from './exam-attempt/exam-attempt.module';

@Module({
  imports: [ExamAttemptModule],
  exports: [ExamAttemptModule],
})
export class AssessmentModule {}
