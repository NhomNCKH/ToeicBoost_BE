import { Module } from '@nestjs/common';
import { ExamAttemptModule } from './exam-attempt/exam-attempt.module';
import { OfficialExamModule } from './official-exam/official-exam.module';

@Module({
  imports: [ExamAttemptModule, OfficialExamModule],
  exports: [ExamAttemptModule, OfficialExamModule],
})
export class AssessmentModule {}
