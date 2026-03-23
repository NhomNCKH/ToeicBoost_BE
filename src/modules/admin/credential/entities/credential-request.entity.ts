import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';
import { User } from '@modules/security/entities/user.entity';
import { ExamTemplate } from '../../exam-template/entities/exam-template.entity';
import { CredentialTemplate } from './credential-template.entity';
import { CredentialRequestStatus } from '@common/constants/credential.enum';
import { Credential } from './credential.entity';
import { CredentialEvent } from './credential-event.entity';
import { ExamAttempt } from '@modules/assessment/exam-attempt/entities/exam-attempt.entity';

@Entity('credential_requests')
export class CredentialRequest extends BaseEntity {
  @Index('idx_credential_requests_status')
  @Column({
    name: 'status',
    type: 'enum',
    enum: CredentialRequestStatus,
    enumName: 'credential_request_status',
    default: CredentialRequestStatus.PENDING,
  })
  status: CredentialRequestStatus;

  @Index('idx_credential_requests_user_id')
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Index('idx_credential_requests_template_id')
  @Column({ name: 'credential_template_id', type: 'uuid' })
  credentialTemplateId: string;

  @Column({ name: 'exam_template_id', type: 'uuid', nullable: true })
  examTemplateId: string | null;

  @Column({ name: 'exam_attempt_id', type: 'uuid', nullable: true })
  examAttemptId: string | null;

  @Column({ name: 'eligibility_source', type: 'varchar', length: 50 })
  eligibilitySource: string;

  @Column({ name: 'source_ref', type: 'varchar', length: 255, nullable: true })
  sourceRef: string | null;

  @Column({
    name: 'eligibility_score',
    type: 'numeric',
    precision: 8,
    scale: 2,
    nullable: true,
  })
  eligibilityScore: string | null;

  @Column({ name: 'pass_threshold_snapshot', type: 'int', nullable: true })
  passThresholdSnapshot: number | null;

  @Column({ name: 'requested_at', type: 'timestamptz' })
  requestedAt: Date;

  @Column({ name: 'decision_at', type: 'timestamptz', nullable: true })
  decisionAt: Date | null;

  @Column({ name: 'decided_by', type: 'uuid', nullable: true })
  decidedById: string | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string | null;

  @Column({
    name: 'approved_payload',
    type: 'jsonb',
    default: () => "'{}'::jsonb",
  })
  approvedPayload: Record<string, unknown>;

  @Column({ name: 'metadata', type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata: Record<string, unknown>;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => CredentialTemplate, (template) => template.requests, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'credential_template_id' })
  credentialTemplate: CredentialTemplate;

  @ManyToOne(() => ExamTemplate, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'exam_template_id' })
  examTemplate: ExamTemplate | null;

  @ManyToOne(
    () => ExamAttempt,
    (examAttempt) => examAttempt.credentialRequests,
    {
      onDelete: 'RESTRICT',
      nullable: true,
    },
  )
  @JoinColumn({ name: 'exam_attempt_id' })
  examAttempt: ExamAttempt | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'decided_by' })
  decidedBy: User | null;

  @OneToOne(() => Credential, (credential) => credential.request)
  credential: Credential | null;

  @OneToMany(() => CredentialEvent, (event) => event.request)
  events: CredentialEvent[];
}
