import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';
import { QuestionPart } from '@common/constants/question-bank.enum';
import { ExamAttempt } from './exam-attempt.entity';
import { QuestionGroup } from '@modules/admin/question-bank/entities/question-group.entity';
import { Question } from '@modules/admin/question-bank/entities/question.entity';

@Entity('exam_attempt_answers')
@Index(
  'uq_exam_attempt_answers_attempt_question',
  ['examAttemptId', 'questionId'],
  {
    unique: true,
  },
)
export class ExamAttemptAnswer extends BaseEntity {
  @Index('idx_exam_attempt_answers_attempt_id')
  @Column({ name: 'exam_attempt_id', type: 'uuid' })
  examAttemptId: string;

  @Index('idx_exam_attempt_answers_question_group_id')
  @Column({ name: 'question_group_id', type: 'uuid' })
  questionGroupId: string;

  @Index('idx_exam_attempt_answers_question_id')
  @Column({ name: 'question_id', type: 'uuid' })
  questionId: string;

  @Index('idx_exam_attempt_answers_part')
  @Column({
    name: 'part',
    type: 'enum',
    enum: QuestionPart,
    enumName: 'question_part',
  })
  part: QuestionPart;

  @Column({ name: 'question_no', type: 'int' })
  questionNo: number;

  @Column({
    name: 'selected_option_key',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  selectedOptionKey: string | null;

  @Column({
    name: 'selected_option_snapshot',
    type: 'jsonb',
    default: () => "'{}'::jsonb",
  })
  selectedOptionSnapshot: Record<string, unknown>;

  @Column({ name: 'is_correct', type: 'boolean', default: false })
  isCorrect: boolean;

  @Column({
    name: 'score_weight_snapshot',
    type: 'numeric',
    precision: 6,
    scale: 2,
    default: 1,
  })
  scoreWeightSnapshot: string;

  @Column({
    name: 'score_awarded',
    type: 'numeric',
    precision: 8,
    scale: 2,
    default: 0,
  })
  scoreAwarded: string;

  @Column({ name: 'answered_at', type: 'timestamptz', nullable: true })
  answeredAt: Date | null;

  @Column({ name: 'time_spent_sec', type: 'int', nullable: true })
  timeSpentSec: number | null;

  @Column({
    name: 'answer_payload',
    type: 'jsonb',
    default: () => "'{}'::jsonb",
  })
  answerPayload: Record<string, unknown>;

  @Column({ name: 'metadata', type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata: Record<string, unknown>;

  @ManyToOne(() => ExamAttempt, (examAttempt) => examAttempt.answers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'exam_attempt_id' })
  examAttempt: ExamAttempt;

  @ManyToOne(() => QuestionGroup, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'question_group_id' })
  questionGroup: QuestionGroup;

  @ManyToOne(() => Question, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'question_id' })
  question: Question;
}
