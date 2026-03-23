import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CredentialEvent } from '@modules/admin/credential/entities/credential-event.entity';
import { CredentialRequest } from '@modules/admin/credential/entities/credential-request.entity';
import { CredentialTemplate } from '@modules/admin/credential/entities/credential-template.entity';
import { ExamTemplate } from '@modules/admin/exam-template/entities/exam-template.entity';
import { ExamAttemptController } from './exam-attempt.controller';
import { CredentialEligibilityService } from './credential-eligibility.service';
import { ExamAttemptService } from './exam-attempt.service';
import { ExamAttempt } from './entities/exam-attempt.entity';
import { ExamAttemptAnswer } from './entities/exam-attempt-answer.entity';
import { ExamAttemptPartScore } from './entities/exam-attempt-part-score.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExamAttempt,
      ExamAttemptAnswer,
      ExamAttemptPartScore,
      ExamTemplate,
      CredentialTemplate,
      CredentialRequest,
      CredentialEvent,
    ]),
  ],
  controllers: [ExamAttemptController],
  providers: [ExamAttemptService, CredentialEligibilityService],
  exports: [TypeOrmModule, ExamAttemptService, CredentialEligibilityService],
})
export class ExamAttemptModule {}
