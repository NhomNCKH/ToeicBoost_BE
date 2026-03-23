import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';
import { User } from '@modules/security/entities/user.entity';
import { Role } from './role.entity';

@Entity('user_roles')
@Index('uq_user_roles_user_role', ['userId', 'roleId'], { unique: true })
export class UserRoleAssignment extends BaseEntity {
  @Index('idx_user_roles_user_id')
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Index('idx_user_roles_role_id')
  @Column({ name: 'role_id', type: 'uuid' })
  roleId: string;

  @ManyToOne(() => User, (user) => user.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Role, (role) => role.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;
}
