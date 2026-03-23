import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';
import { User } from '@modules/security/entities/user.entity';
import { AdminInviteStatus } from '@common/constants/admin-rbac.enum';
import { Role } from './role.entity';

@Entity('admin_invites')
export class AdminInvite extends BaseEntity {
  @Index('idx_admin_invites_email')
  @Column({ name: 'email', type: 'varchar', length: 255 })
  email: string;

  @Column({ name: 'role_id', type: 'uuid' })
  roleId: string;

  @Index('uq_admin_invites_token_hash', { unique: true })
  @Column({ name: 'token_hash', type: 'varchar', length: 255 })
  tokenHash: string;

  @Index('idx_admin_invites_status')
  @Column({
    name: 'status',
    type: 'enum',
    enum: AdminInviteStatus,
    enumName: 'admin_invite_status',
    default: AdminInviteStatus.PENDING,
  })
  status: AdminInviteStatus;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'accepted_at', type: 'timestamptz', nullable: true })
  acceptedAt: Date | null;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @Column({ name: 'accepted_user_id', type: 'uuid', nullable: true })
  acceptedUserId: string | null;

  @Index('idx_admin_invites_invited_by')
  @Column({ name: 'invited_by', type: 'uuid' })
  invitedById: string;

  @Column({ name: 'metadata', type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata: Record<string, unknown>;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'invited_by' })
  invitedBy: User;

  @ManyToOne(() => Role, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'accepted_user_id' })
  acceptedUser: User | null;
}
