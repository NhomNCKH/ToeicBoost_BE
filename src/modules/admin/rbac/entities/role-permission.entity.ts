import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';
import { Permission } from './permission.entity';
import { Role } from './role.entity';

@Entity('role_permissions')
@Index('uq_role_permissions_role_permission', ['roleId', 'permissionId'], {
  unique: true,
})
export class RolePermission extends BaseEntity {
  @Index('idx_role_permissions_role_id')
  @Column({ name: 'role_id', type: 'uuid' })
  roleId: string;

  @Index('idx_role_permissions_permission_id')
  @Column({ name: 'permission_id', type: 'uuid' })
  permissionId: string;

  @ManyToOne(() => Role, (role) => role.rolePermissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => Permission, (permission) => permission.rolePermissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;
}
