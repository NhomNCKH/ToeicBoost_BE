import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Flashcard } from './flashcard.entity';

export type FlashcardProgressState =
  | 'new'
  | 'learning'
  | 'review'
  | 'relearning'
  | 'suspended';

@Entity('flashcard_progress')
@Index('uq_flashcard_progress_user_flashcard', ['userId', 'flashcardId'], {
  unique: true,
})
export class FlashcardProgress extends BaseEntity {
  @Index('idx_flashcard_progress_user_id')
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Index('idx_flashcard_progress_flashcard_id')
  @Column({ name: 'flashcard_id', type: 'uuid' })
  flashcardId: string;

  @ManyToOne(() => Flashcard, (card) => card.progress, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'flashcard_id' })
  flashcard: Flashcard;

  @Index('idx_flashcard_progress_due_at')
  @Column({ name: 'due_at', type: 'timestamptz', nullable: true })
  dueAt: Date | null;

  @Column({
    name: 'state',
    type: 'varchar',
    length: 20,
    default: 'new',
  })
  state: FlashcardProgressState;

  @Column({ name: 'interval_days', type: 'int', default: 0 })
  intervalDays: number;

  @Column({ name: 'ease_factor', type: 'numeric', precision: 6, scale: 2, default: 2.5 })
  easeFactor: number;

  @Column({ name: 'reps', type: 'int', default: 0 })
  reps: number;

  @Column({ name: 'lapses', type: 'int', default: 0 })
  lapses: number;

  @Column({ name: 'last_reviewed_at', type: 'timestamptz', nullable: true })
  lastReviewedAt: Date | null;

  // Fields reserved for FSRS upgrade
  @Column({ name: 'stability', type: 'numeric', precision: 10, scale: 4, nullable: true })
  stability: number | null;

  @Column({ name: 'difficulty', type: 'numeric', precision: 10, scale: 4, nullable: true })
  difficulty: number | null;

  @Column({ name: 'suspended', type: 'boolean', default: false })
  suspended: boolean;
}

