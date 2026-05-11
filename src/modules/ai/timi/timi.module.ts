import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimiSession } from './entities/timi-session.entity';
import { TimiTurn } from './entities/timi-turn.entity';
import { GroqLlmAdapter } from './adapters/groq-llm.adapter';
import { GroqSttAdapter } from './adapters/groq-stt.adapter';
import { EdgeTtsAdapter } from './adapters/edge-tts.adapter';
import { TimiService } from './timi.service';
import { TimiController } from './timi.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TimiSession, TimiTurn])],
  controllers: [TimiController],
  providers: [TimiService, GroqLlmAdapter, GroqSttAdapter, EdgeTtsAdapter],
  exports: [TimiService],
})
export class TimiModule {}
