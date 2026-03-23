import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionGroup } from '../question-bank/entities/question-group.entity';
import { ExamTemplate } from './entities/exam-template.entity';
import { ExamTemplateSection } from './entities/exam-template-section.entity';
import { ExamTemplateRule } from './entities/exam-template-rule.entity';
import { ExamTemplateItem } from './entities/exam-template-item.entity';
import { AdminExamTemplateController } from './admin-exam-template.controller';
import { AdminExamTemplateService } from './admin-exam-template.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      QuestionGroup,
      ExamTemplate,
      ExamTemplateSection,
      ExamTemplateRule,
      ExamTemplateItem,
    ]),
  ],
  controllers: [AdminExamTemplateController],
  providers: [AdminExamTemplateService],
  exports: [TypeOrmModule, AdminExamTemplateService],
})
export class AdminExamTemplateModule {}
