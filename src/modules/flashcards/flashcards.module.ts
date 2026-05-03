import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiTutorModule } from '@modules/ai-tutor/ai-tutor.module';
import { FlashcardsController, LearnerFlashcardsController } from './flashcards.controller';
import { FlashcardsService } from './flashcards.service';
import { FlashcardDeck } from './entities/flashcard-deck.entity';
import { Flashcard } from './entities/flashcard.entity';
import { FlashcardProgress } from './entities/flashcard-progress.entity';
import { FlashcardReviewLog } from './entities/flashcard-review-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([FlashcardDeck, Flashcard, FlashcardProgress, FlashcardReviewLog]),
    AiTutorModule,
  ],
  controllers: [FlashcardsController, LearnerFlashcardsController],
  providers: [FlashcardsService],
  exports: [FlashcardsService],
})
export class FlashcardsModule {}
