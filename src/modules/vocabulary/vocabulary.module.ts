import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VocabularyDeck } from './entities/vocabulary-deck.entity';
import { VocabularyItem } from './entities/vocabulary-item.entity';
import { VocabularyService } from './vocabulary.service';
import { AdminVocabularyController } from './admin-vocabulary.controller';
import { LearnerVocabularyController } from './learner-vocabulary.controller';

@Module({
  imports: [TypeOrmModule.forFeature([VocabularyDeck, VocabularyItem])],
  controllers: [AdminVocabularyController, LearnerVocabularyController],
  providers: [VocabularyService],
  exports: [VocabularyService],
})
export class VocabularyModule {}
