import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';
import { Question } from './question.entity';

@Entity('question_options')
export class QuestionOption extends BaseEntity {
  @Index('idx_question_options_question_id')
  @Column({ name: 'question_id', type: 'uuid' })
  questionId: string;

  @Column({ name: 'option_key', type: 'varchar', length: 10 })
  optionKey: string;

  @Column({ name: 'content', type: 'text' })
  content: string;

  @Column({ name: 'is_correct', type: 'boolean', default: false })
  isCorrect: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @ManyToOne(() => Question, (question) => question.options, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'question_id' })
  question: Question;
}
