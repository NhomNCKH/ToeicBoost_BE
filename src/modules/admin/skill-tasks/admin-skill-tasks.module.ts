import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminSkillTasksController } from './admin-skill-tasks.controller';
import { AdminSkillTasksService } from './admin-skill-tasks.service';
import { LearnerSkillTasksController } from './learner-skill-tasks.controller';
import { ToeicSpeakingTask } from './entities/toeic-speaking-task.entity';
import { ToeicSpeakingSet } from './entities/toeic-speaking-set.entity';
import { ToeicSpeakingSetItem } from './entities/toeic-speaking-set-item.entity';
import { ToeicWritingTask } from './entities/toeic-writing-task.entity';
import { ToeicWritingSet } from './entities/toeic-writing-set.entity';
import { ToeicWritingSetItem } from './entities/toeic-writing-set-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ToeicWritingTask,
      ToeicWritingSet,
      ToeicWritingSetItem,
      ToeicSpeakingTask,
      ToeicSpeakingSet,
      ToeicSpeakingSetItem,
    ]),
  ],
  controllers: [AdminSkillTasksController, LearnerSkillTasksController],
  providers: [AdminSkillTasksService],
  exports: [AdminSkillTasksService],
})
export class AdminSkillTasksModule {}

