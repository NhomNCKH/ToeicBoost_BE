import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Flashcard } from './flashcard.entity';

export type FlashcardReviewRating = 'again' | 'hard' | 'good' | 'easy';

@Entity('flashcard_review_logs')
@Index('idx_flashcard_review_logs_user_id', ['userId'])
@Index('idx_flashcard_review_logs_flashcard_id', ['flashcardId'])
@Index('idx_flashcard_review_logs_created_at', ['createdAt'])
export class FlashcardReviewLog extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'flashcard_id', type: 'uuid' })
  flashcardId: string;

  @ManyToOne(() => Flashcard, (card) => card.reviewLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'flashcard_id' })
  flashcard: Flashcard;

  @Column({ name: 'rating', type: 'varchar', length: 10 })
  rating: FlashcardReviewRating;

  @Column({ name: 'previous_due_at', type: 'timestamptz', nullable: true })
  previousDueAt: Date | null;

  @Column({ name: 'next_due_at', type: 'timestamptz', nullable: true })
  nextDueAt: Date | null;

  @Column({ name: 'time_ms', type: 'int', nullable: true })
  timeMs: number | null;

  @Column({ name: 'metadata', type: 'jsonb', default: () => `'{}'::jsonb` })
  metadata: Record<string, any>;
}

