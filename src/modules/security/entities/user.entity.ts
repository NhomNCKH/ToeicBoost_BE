import { Column, Entity, Index, OneToMany } from 'typeorm';
import { UserStatus } from '../../../common/constants/user.enum';
import { BaseEntity } from '../../../database/entities/base.entity';
import { UserRoleAssignment } from '../../admin/rbac/entities/user-role.entity';
import { ExamAttempt } from '../../assessment/exam-attempt/entities/exam-attempt.entity';

@Entity('users')
export class User extends BaseEntity {
  @Index('uq_users_email', { unique: true })
  @Column({ name: 'email', type: 'varchar', length: 255 })
  email: string;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  passwordHash: string | null;

  @Column({ name: 'name', type: 'varchar', length: 100 })
  name: string;

  @Index('idx_users_status')
  @Column({
    name: 'status',
    type: 'enum',
    enum: UserStatus,
    enumName: 'user_status',
    default: UserStatus.PENDING_VERIFICATION,
  })
  status: UserStatus;

  @Column({ name: 'avatar_url', type: 'varchar', length: 500, nullable: true })
  avatarUrl: string | null;

  @Column({
    name: 'avatar_s3_key',
    type: 'varchar',
    length: 600,
    nullable: true,
  })
  avatarS3Key: string | null;

  @Column({ name: 'phone', type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @Column({ name: 'birthday', type: 'date', nullable: true })
  birthday: string | null;

  @Column({ name: 'address', type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @Column({ name: 'bio', type: 'text', nullable: true })
  bio: string | null;

  @Column({ name: 'linkedin', type: 'varchar', length: 255, nullable: true })
  linkedin: string | null;

  @Column({ name: 'github', type: 'varchar', length: 255, nullable: true })
  github: string | null;

  @Column({ name: 'twitter', type: 'varchar', length: 255, nullable: true })
  twitter: string | null;

  @Index('uq_users_google_id', {
    unique: true,
    where: '"google_id" IS NOT NULL',
  })
  @Column({ name: 'google_id', type: 'varchar', length: 255, nullable: true })
  googleId: string | null;

  @Column({ name: 'mfa_enabled', type: 'boolean', default: false })
  mfaEnabled: boolean;

  @Column({ name: 'failed_login_attempts', type: 'int', default: 0 })
  failedLoginAttempts: number;

  @Column({ name: 'locked_until', type: 'timestamptz', nullable: true })
  lockedUntil: Date | null;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  @OneToMany(() => UserRoleAssignment, (userRole) => userRole.user)
  userRoles: UserRoleAssignment[];

  @OneToMany(() => ExamAttempt, (examAttempt) => examAttempt.user)
  examAttempts: ExamAttempt[];
}
