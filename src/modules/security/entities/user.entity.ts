import { Column, Entity, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { UserRole, UserStatus } from '../../../common/enums/user.enum';
import { Profile } from './profile.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ name: 'email', unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'name' })
  name: string;

  @Column({
    name: 'role',
    type: 'enum',
    enum: UserRole,
    default: UserRole.LEARNER,
  })
  role: UserRole;

  @Column({
    name: 'status',
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING_VERIFICATION,
  })
  status: UserStatus;

  @Column({ name: 'avatar_url', type: 'varchar', nullable: true })
  avatarUrl: string | null;

  @Column({ name: 'mfa_enabled', default: false })
  mfaEnabled: boolean;

  @OneToOne(() => Profile, (profile) => profile.user)
  profile: Profile;
}
