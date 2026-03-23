import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardKpiSnapshot } from './entities/dashboard-kpi-snapshot.entity';
import { QuestionQualitySnapshot } from './entities/question-quality-snapshot.entity';
import { ExamPerformanceSnapshot } from './entities/exam-performance-snapshot.entity';
import { ReportJob } from './entities/report-job.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DashboardKpiSnapshot,
      QuestionQualitySnapshot,
      ExamPerformanceSnapshot,
      ReportJob,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class AdminDashboardModule {}
