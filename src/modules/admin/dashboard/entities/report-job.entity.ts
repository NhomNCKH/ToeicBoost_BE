import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';
import { User } from '@modules/security/entities/user.entity';
import {
  ReportJobStatus,
  ReportJobType,
} from '@common/constants/dashboard.enum';

@Entity('report_jobs')
export class ReportJob extends BaseEntity {
  @Index('idx_report_jobs_type')
  @Column({
    name: 'type',
    type: 'enum',
    enum: ReportJobType,
    enumName: 'report_job_type',
  })
  type: ReportJobType;

  @Index('idx_report_jobs_status')
  @Column({
    name: 'status',
    type: 'enum',
    enum: ReportJobStatus,
    enumName: 'report_job_status',
    default: ReportJobStatus.QUEUED,
  })
  status: ReportJobStatus;

  @Index('idx_report_jobs_requested_by')
  @Column({ name: 'requested_by', type: 'uuid' })
  requestedById: string;

  @Column({
    name: 'file_storage_key',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  fileStorageKey: string | null;

  @Column({
    name: 'file_public_url',
    type: 'varchar',
    length: 1000,
    nullable: true,
  })
  filePublicUrl: string | null;

  @Column({ name: 'filters', type: 'jsonb', default: () => "'{}'::jsonb" })
  filters: Record<string, unknown>;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ name: 'rows_exported', type: 'int', nullable: true })
  rowsExported: number | null;

  @Column({ name: 'metadata', type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata: Record<string, unknown>;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'requested_by' })
  requestedBy: User;
}
