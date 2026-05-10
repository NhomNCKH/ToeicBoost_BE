import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@modules/security/entities/user.entity';
import { Credential } from '@modules/admin/credential/entities/credential.entity';
import { CredentialRequest } from '@modules/admin/credential/entities/credential-request.entity';
import { CredentialTemplate } from '@modules/admin/credential/entities/credential-template.entity';
import { CredentialEvent } from '@modules/admin/credential/entities/credential-event.entity';
import { ExamTemplate } from '@modules/admin/exam-template/entities/exam-template.entity';
import { QuestionGroup } from '@modules/admin/question-bank/entities/question-group.entity';
import { Question } from '@modules/admin/question-bank/entities/question.entity';
import { ExamAttempt } from '@modules/assessment/exam-attempt/entities/exam-attempt.entity';
import { OfficialExamRegistration } from '@modules/assessment/official-exam/entities/official-exam-registration.entity';
import { DashboardKpiSnapshot } from './entities/dashboard-kpi-snapshot.entity';
import { QuestionQualitySnapshot } from './entities/question-quality-snapshot.entity';
import { ExamPerformanceSnapshot } from './entities/exam-performance-snapshot.entity';
import { ReportJob } from './entities/report-job.entity';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Credential,
      CredentialRequest,
      CredentialTemplate,
      CredentialEvent,
      ExamTemplate,
      QuestionGroup,
      Question,
      ExamAttempt,
      OfficialExamRegistration,
      DashboardKpiSnapshot,
      QuestionQualitySnapshot,
      ExamPerformanceSnapshot,
      ReportJob,
    ]),
  ],
  controllers: [AdminDashboardController],
  providers: [AdminDashboardService],
  exports: [TypeOrmModule, AdminDashboardService],
})
export class AdminDashboardModule {}
