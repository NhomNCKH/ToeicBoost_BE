import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { S3StorageModule } from '@modules/s3/s3-storage.module';
import { Tag } from './entities/tag.entity';
import { QuestionGroup } from './entities/question-group.entity';
import { QuestionGroupAsset } from './entities/question-group-asset.entity';
import { Question } from './entities/question.entity';
import { QuestionOption } from './entities/question-option.entity';
import { QuestionGroupTag } from './entities/question-group-tag.entity';
import { QuestionGroupReview } from './entities/question-group-review.entity';
import { AdminQuestionBankController } from './admin-question-bank.controller';
import { AdminQuestionBankService } from './admin-question-bank.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tag,
      QuestionGroup,
      QuestionGroupAsset,
      Question,
      QuestionOption,
      QuestionGroupTag,
      QuestionGroupReview,
    ]),
    S3StorageModule,
  ],
  controllers: [AdminQuestionBankController],
  providers: [AdminQuestionBankService],
  exports: [TypeOrmModule, AdminQuestionBankService],
})
export class AdminQuestionBankModule {}
