import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamTemplate } from '@modules/admin/exam-template/entities/exam-template.entity';
import { User } from '@modules/security/entities/user.entity';
import { NotificationModule } from '@modules/notification/notification.module';
import { OfficialExamRegistration } from './entities/official-exam-registration.entity';
import { LearnerOfficialExamController } from './learner-official-exam.controller';
import { OfficialExamService } from './official-exam.service';
import { OfficialExamReminderScheduler } from './official-exam.scheduler';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExamTemplate, User, OfficialExamRegistration]),
    NotificationModule,
  ],
  controllers: [LearnerOfficialExamController],
  providers: [OfficialExamService, OfficialExamReminderScheduler],
  exports: [OfficialExamService],
})
export class OfficialExamModule {}

