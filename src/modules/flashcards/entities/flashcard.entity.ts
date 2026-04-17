import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { FlashcardDeck } from './flashcard-deck.entity';
import { FlashcardProgress } from './flashcard-progress.entity';
import { FlashcardReviewLog } from './flashcard-review-log.entity';

@Entity('flashcards')
export class Flashcard extends BaseEntity {
  @Index('idx_flashcards_deck_id')
  @Column({ name: 'deck_id', type: 'uuid' })
  deckId: string;

  @ManyToOne(() => FlashcardDeck, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deck_id' })
  deck: FlashcardDeck;

  @Column({ name: 'front', type: 'text' })
  front: string;

  @Column({ name: 'back', type: 'text' })
  back: string;

  @Column({ name: 'note', type: 'text', nullable: true })
  note: string | null;

  @Column({ name: 'tags', type: 'text', array: true, nullable: true })
  tags: string[] | null;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => FlashcardProgress, (p) => p.flashcard)
  progress: FlashcardProgress[];

  @OneToMany(() => FlashcardReviewLog, (l) => l.flashcard)
  reviewLogs: FlashcardReviewLog[];
}

