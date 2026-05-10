import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiTutorModule } from '@modules/ai-tutor/ai-tutor.module';
import { ShadowingContent } from './entities/shadowing-content.entity';
import { ShadowingSegment } from './entities/shadowing-segment.entity';
import { ShadowingService } from './shadowing.service';
import { ShadowingYoutubeService } from './shadowing-youtube.service';
import { AdminShadowingController } from './admin-shadowing.controller';
import { LearnerShadowingController } from './learner-shadowing.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ShadowingContent, ShadowingSegment]), AiTutorModule],
  controllers: [AdminShadowingController, LearnerShadowingController],
  providers: [ShadowingService, ShadowingYoutubeService],
})
export class ShadowingModule {}

