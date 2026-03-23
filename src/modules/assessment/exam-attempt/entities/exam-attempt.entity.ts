import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';
import { User } from '@modules/security/entities/user.entity';
import { ExamTemplate } from '@modules/admin/exam-template/entities/exam-template.entity';
import { TemplateMode } from '@common/constants/exam-template.enum';
import { ExamAttemptStatus } from '@common/constants/assessment.enum';
import { ExamAttemptAnswer } from './exam-attempt-answer.entity';
import { ExamAttemptPartScore } from './exam-attempt-part-score.entity';
import { CredentialRequest } from '@modules/admin/credential/entities/credential-request.entity';

@Entity('exam_attempts')
@Index(
  'uq_exam_attempts_user_template_attempt_no',
  ['userId', 'examTemplateId', 'attemptNo'],
  {
    unique: true,
  },
)
export class ExamAttempt extends BaseEntity {
  @Index('idx_exam_attempts_user_id')
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Index('idx_exam_attempts_exam_template_id')
  @Column({ name: 'exam_template_id', type: 'uuid' })
  examTemplateId: string;

  @Column({ name: 'attempt_no', type: 'int' })
  attemptNo: number;

  @Index('idx_exam_attempts_status')
  @Column({
    name: 'status',
    type: 'enum',
    enum: ExamAttemptStatus,
    enumName: 'exam_attempt_status',
    default: ExamAttemptStatus.IN_PROGRESS,
  })
  status: ExamAttemptStatus;

  @Column({
    name: 'mode',
    type: 'enum',
    enum: TemplateMode,
    enumName: 'template_mode',
  })
  mode: TemplateMode;

  @Index('idx_exam_attempts_started_at')
  @Column({ name: 'started_at', type: 'timestamptz' })
  startedAt: Date;

  @Index('idx_exam_attempts_submitted_at')
  @Column({ name: 'submitted_at', type: 'timestamptz', nullable: true })
  submittedAt: Date | null;

  @Column({ name: 'graded_at', type: 'timestamptz', nullable: true })
  gradedAt: Date | null;

  @Column({ name: 'duration_sec', type: 'int', nullable: true })
  durationSec: number | null;

  @Column({ name: 'total_questions', type: 'int', default: 0 })
  totalQuestions: number;

  @Column({ name: 'answered_count', type: 'int', default: 0 })
  answeredCount: number;

  @Column({ name: 'correct_count', type: 'int', default: 0 })
  correctCount: number;

  @Column({
    name: 'listening_raw_score',
    type: 'numeric',
    precision: 8,
    scale: 2,
    default: 0,
  })
  listeningRawScore: string;

  @Column({
    name: 'reading_raw_score',
    type: 'numeric',
    precision: 8,
    scale: 2,
    default: 0,
  })
  readingRawScore: string;

  @Column({
    name: 'listening_scaled_score',
    type: 'numeric',
    precision: 8,
    scale: 2,
    default: 0,
  })
  listeningScaledScore: string;

  @Column({
    name: 'reading_scaled_score',
    type: 'numeric',
    precision: 8,
    scale: 2,
    default: 0,
  })
  readingScaledScore: string;

  @Column({
    name: 'total_score',
    type: 'numeric',
    precision: 8,
    scale: 2,
    default: 0,
  })
  totalScore: string;

  @Column({ name: 'pass_threshold_snapshot', type: 'int', default: 500 })
  passThresholdSnapshot: number;

  @Column({ name: 'passed', type: 'boolean', default: false })
  passed: boolean;

  @Column({
    name: 'scoring_version',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  scoringVersion: string | null;

  @Column({
    name: 'template_snapshot',
    type: 'jsonb',
    default: () => "'{}'::jsonb",
  })
  templateSnapshot: Record<string, unknown>;

  @Column({
    name: 'result_payload',
    type: 'jsonb',
    default: () => "'{}'::jsonb",
  })
  resultPayload: Record<string, unknown>;

  @Column({ name: 'metadata', type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata: Record<string, unknown>;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => ExamTemplate, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'exam_template_id' })
  examTemplate: ExamTemplate;

  @OneToMany(() => ExamAttemptAnswer, (answer) => answer.examAttempt)
  answers: ExamAttemptAnswer[];

  @OneToMany(() => ExamAttemptPartScore, (partScore) => partScore.examAttempt)
  partScores: ExamAttemptPartScore[];

  @OneToMany(
    () => CredentialRequest,
    (credentialRequest) => credentialRequest.examAttempt,
  )
  credentialRequests: CredentialRequest[];
}
