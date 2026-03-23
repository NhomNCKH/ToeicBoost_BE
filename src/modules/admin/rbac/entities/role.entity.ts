import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';
import { UserRoleAssignment } from './user-role.entity';
import { RolePermission } from './role-permission.entity';

@Entity('roles')
export class Role extends BaseEntity {
  @Index('uq_roles_code', { unique: true })
  @Column({ name: 'code', type: 'varchar', length: 50 })
  code: string;

  @Column({ name: 'name', type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'is_system', type: 'boolean', default: false })
  isSystem: boolean;

  @Column({ name: 'metadata', type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata: Record<string, unknown>;

  @OneToMany(() => UserRoleAssignment, (userRole) => userRole.role)
  userRoles: UserRoleAssignment[];

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
  rolePermissions: RolePermission[];
}
