import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';
import { DashboardScopeType } from '@common/constants/dashboard.enum';

@Index(
  'uq_dashboard_kpi_snapshots_date_scope',
  ['snapshotDate', 'scopeType', 'scopeRef'],
  { unique: true },
)
@Entity('dashboard_kpi_snapshots')
export class DashboardKpiSnapshot extends BaseEntity {
  @Column({ name: 'snapshot_date', type: 'date' })
  snapshotDate: string;

  @Index('idx_dashboard_kpi_snapshots_scope_type')
  @Column({
    name: 'scope_type',
    type: 'enum',
    enum: DashboardScopeType,
    enumName: 'dashboard_scope_type',
    default: DashboardScopeType.GLOBAL,
  })
  scopeType: DashboardScopeType;

  @Column({ name: 'scope_ref', type: 'varchar', length: 255, default: '' })
  scopeRef: string;

  @Column({ name: 'active_learners', type: 'int', default: 0 })
  activeLearners: number;

  @Column({ name: 'active_admins', type: 'int', default: 0 })
  activeAdmins: number;

  @Column({ name: 'new_users', type: 'int', default: 0 })
  newUsers: number;

  @Column({ name: 'practice_attempts', type: 'int', default: 0 })
  practiceAttempts: number;

  @Column({ name: 'mock_test_attempts', type: 'int', default: 0 })
  mockTestAttempts: number;

  @Column({
    name: 'average_score',
    type: 'numeric',
    precision: 8,
    scale: 2,
    default: 0,
  })
  averageScore: string;

  @Column({
    name: 'pass_rate',
    type: 'numeric',
    precision: 5,
    scale: 2,
    default: 0,
  })
  passRate: string;

  @Column({ name: 'credentials_issued', type: 'int', default: 0 })
  credentialsIssued: number;

  @Column({ name: 'credentials_revoked', type: 'int', default: 0 })
  credentialsRevoked: number;

  @Column({ name: 'metadata', type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata: Record<string, unknown>;
}
