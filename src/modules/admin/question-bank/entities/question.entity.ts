import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';
import { QuestionGroup } from './question-group.entity';
import { QuestionOption } from './question-option.entity';

@Entity('questions')
export class Question extends BaseEntity {
  @Index('idx_questions_group_id')
  @Column({ name: 'question_group_id', type: 'uuid' })
  questionGroupId: string;

  @Column({ name: 'question_no', type: 'int' })
  questionNo: number;

  @Column({ name: 'prompt', type: 'text' })
  prompt: string;

  @Column({ name: 'answer_key', type: 'varchar', length: 10 })
  answerKey: string;

  @Column({ name: 'rationale', type: 'text', nullable: true })
  rationale: string | null;

  @Column({ name: 'time_limit_sec', type: 'int', nullable: true })
  timeLimitSec: number | null;

  @Column({
    name: 'score_weight',
    type: 'numeric',
    precision: 6,
    scale: 2,
    default: 1,
  })
  scoreWeight: string;

  @Column({ name: 'metadata', type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata: Record<string, unknown>;

  @ManyToOne(() => QuestionGroup, (questionGroup) => questionGroup.questions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'question_group_id' })
  questionGroup: QuestionGroup;

  @OneToMany(() => QuestionOption, (option) => option.question)
  options: QuestionOption[];
}
