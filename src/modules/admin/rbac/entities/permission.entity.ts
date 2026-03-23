import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';
import { RolePermission } from './role-permission.entity';

@Entity('permissions')
export class Permission extends BaseEntity {
  @Index('uq_permissions_code', { unique: true })
  @Column({ name: 'code', type: 'varchar', length: 100 })
  code: string;

  @Column({ name: 'name', type: 'varchar', length: 150 })
  name: string;

  @Column({ name: 'module', type: 'varchar', length: 100, nullable: true })
  module: string | null;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'metadata', type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata: Record<string, unknown>;

  @OneToMany(
    () => RolePermission,
    (rolePermission) => rolePermission.permission,
  )
  rolePermissions: RolePermission[];
}
