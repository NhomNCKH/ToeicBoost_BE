import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';
import { User } from '@modules/security/entities/user.entity';

@Entity('audit_logs')
export class AuditLog extends BaseEntity {
  @Index('idx_audit_logs_actor_id')
  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId: string | null;

  @Column({ name: 'actor_email', type: 'varchar', length: 255, nullable: true })
  actorEmail: string | null;

  @Index('idx_audit_logs_action')
  @Column({ name: 'action', type: 'varchar', length: 100 })
  action: string;

  @Index('idx_audit_logs_resource_type')
  @Column({ name: 'resource_type', type: 'varchar', length: 100 })
  resourceType: string;

  @Column({ name: 'resource_id', type: 'varchar', length: 255, nullable: true })
  resourceId: string | null;

  @Column({ name: 'route', type: 'varchar', length: 255, nullable: true })
  route: string | null;

  @Column({ name: 'method', type: 'varchar', length: 20, nullable: true })
  method: string | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 100, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 1000, nullable: true })
  userAgent: string | null;

  @Column({ name: 'status_code', type: 'int', nullable: true })
  statusCode: number | null;

  @Column({ name: 'success', type: 'boolean', default: true })
  success: boolean;

  @Column({ name: 'changes', type: 'jsonb', default: () => "'{}'::jsonb" })
  changes: Record<string, unknown>;

  @Column({ name: 'metadata', type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata: Record<string, unknown>;

  @Column({ name: 'occurred_at', type: 'timestamptz' })
  occurredAt: Date;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'actor_id' })
  actor: User | null;
}
