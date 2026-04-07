import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@modules/security/entities/user.entity';
import { Credential } from '@modules/admin/credential/entities/credential.entity';
import { ExamTemplate } from '@modules/admin/exam-template/entities/exam-template.entity';
import { QuestionGroup } from '@modules/admin/question-bank/entities/question-group.entity';
import { Question } from '@modules/admin/question-bank/entities/question.entity';
import { ExamAttempt } from '@modules/assessment/exam-attempt/entities/exam-attempt.entity';
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
      ExamTemplate,
      QuestionGroup,
      Question,
      ExamAttempt,
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
