import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiTutorModule } from '@modules/ai-tutor/ai-tutor.module';
import { ShadowingYoutubeService } from '@modules/shadowing/shadowing-youtube.service';
import { DailyDictationContent } from './entities/daily-dictation-content.entity';
import { DailyDictationSegment } from './entities/daily-dictation-segment.entity';
import { DailyDictationService } from './daily-dictation.service';
import { AdminDailyDictationController } from './admin-daily-dictation.controller';
import { LearnerDailyDictationController } from './learner-daily-dictation.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DailyDictationContent, DailyDictationSegment]), AiTutorModule],
  controllers: [AdminDailyDictationController, LearnerDailyDictationController],
  providers: [DailyDictationService, ShadowingYoutubeService],
})
export class DailyDictationModule {}
