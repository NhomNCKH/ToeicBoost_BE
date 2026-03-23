import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';
import { User } from '@modules/security/entities/user.entity';
import { QuestionGroup } from './question-group.entity';

@Entity('question_group_reviews')
export class QuestionGroupReview extends BaseEntity {
  @Index('idx_question_group_reviews_group_id')
  @Column({ name: 'question_group_id', type: 'uuid' })
  questionGroupId: string;

  @Column({ name: 'action', type: 'varchar', length: 30 })
  action: string;

  @Column({ name: 'comment', type: 'text', nullable: true })
  comment: string | null;

  @Column({ name: 'performed_by', type: 'uuid' })
  performedById: string;

  @ManyToOne(() => QuestionGroup, (questionGroup) => questionGroup.reviews, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'question_group_id' })
  questionGroup: QuestionGroup;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'performed_by' })
  performedBy: User;
}
