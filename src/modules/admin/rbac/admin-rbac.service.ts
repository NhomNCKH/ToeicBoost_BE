import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserStatus } from '@common/constants/user.enum';
import { User } from '@modules/security/entities/user.entity';
import { HashHelper } from '@helpers/hash.helper';
import { Permission } from './entities/permission.entity';
import { Role } from './entities/role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { UserRoleAssignment } from './entities/user-role.entity';
import {
  CreateAdminUserDto,
  CreatePermissionDto,
  CreateRoleDto,
  RbacPermissionQueryDto,
  RbacRoleQueryDto,
  RbacUserQueryDto,
  ReplaceRolePermissionsDto,
  ReplaceUserRolesDto,
  UpdateAdminUserDto,
  UpdatePermissionDto,
  UpdateRoleDto,
} from './dto/admin-rbac.dto';

@Injectable()
export class AdminRbacService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(UserRoleAssignment)
    private readonly userRoleRepository: Repository<UserRoleAssignment>,
  ) {}

  async listRoles(query: RbacRoleQueryDto) {
    const sortMap: Record<string, string> = {
      createdAt: 'role.createdAt',
      updatedAt: 'role.updatedAt',
      name: 'role.name',
      code: 'role.code',
    };
    const sortBy = sortMap[query.sort ?? 'createdAt'] ?? 'role.createdAt';

    const qb = this.roleRepository
      .createQueryBuilder('role')
      .leftJoinAndSelect('role.rolePermissions', 'rolePermission')
      .leftJoinAndSelect('rolePermission.permission', 'permission')
      .orderBy(sortBy, query.order ?? 'DESC')
      .skip(((query.page ?? 1) - 1) * (query.limit ?? 20))
      .take(query.limit ?? 20);

    if (query.keyword) {
      qb.andWhere(
        '(role.name ILIKE :keyword OR role.code ILIKE :keyword OR role.description ILIKE :keyword)',
        { keyword: `%${query.keyword}%` },
      );
    }

    if (query.isSystem !== undefined) {
      qb.andWhere('role.isSystem = :isSystem', { isSystem: query.isSystem });
    }

    const [roles, total] = await qb.getManyAndCount();

    return {
      success: true,
      data: {
        items: roles.map((role) => ({
          id: role.id,
          code: role.code,
          name: role.name,
          description: role.description,
          isSystem: role.isSystem,
          permissions: (role.rolePermissions ?? []).map((rp) => ({
            id: rp.permission.id,
            code: rp.permission.code,
            name: rp.permission.name,
            module: rp.permission.module,
          })),
          createdAt: role.createdAt,
          updatedAt: role.updatedAt,
        })),
        meta: {
          total,
          page: query.page ?? 1,
          limit: query.limit ?? 20,
        },
      },
    };
  }

  async createRole(dto: CreateRoleDto, creatorId: string) {
    const existing = await this.roleRepository.findOne({
      where: { code: dto.code.trim() },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(`Role already exists: ${dto.code}`);
    }

    const role = await this.roleRepository.save(
      this.roleRepository.create({
        code: dto.code.trim(),
        name: dto.name.trim(),
        description: dto.description?.trim() ?? null,
        isSystem: false,
        createdById: creatorId,
      }),
    );

    return {
      success: true,
      data: role,
    };
  }

  async updateRole(id: string, dto: UpdateRoleDto) {
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (dto.code && dto.code.trim() !== role.code) {
      const exists = await this.roleRepository.findOne({
        where: { code: dto.code.trim() },
        select: { id: true },
      });
      if (exists) {
        throw new ConflictException(`Role already exists: ${dto.code}`);
      }
      role.code = dto.code.trim();
    }

    role.name = dto.name?.trim() ?? role.name;
    role.description =
      dto.description !== undefined
        ? (dto.description?.trim() ?? null)
        : role.description;

    await this.roleRepository.save(role);

    return {
      success: true,
      data: role,
    };
  }

  async deleteRole(id: string) {
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.isSystem) {
      throw new BadRequestException('System role cannot be deleted');
    }

    const assignedCount = await this.userRoleRepository.count({
      where: { roleId: id },
    });
    if (assignedCount > 0) {
      throw new BadRequestException(
        'Role is still assigned to users and cannot be deleted',
      );
    }

    await this.roleRepository.delete(id);

    return {
      success: true,
    };
  }

  async replaceRolePermissions(roleId: string, dto: ReplaceRolePermissionsDto) {
    const role = await this.roleRepository.findOne({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const normalizedPermissionCodes = Array.from(new Set(dto.permissions));
    const permissions = normalizedPermissionCodes.length
      ? await this.permissionRepository.find({
          where: normalizedPermissionCodes.map((code) => ({ code })),
        })
      : [];

    if (permissions.length !== normalizedPermissionCodes.length) {
      const missing = normalizedPermissionCodes.filter(
        (code) => !permissions.some((permission) => permission.code === code),
      );
      throw new BadRequestException(
        `Missing permission codes: ${missing.join(', ')}`,
      );
    }

    await this.rolePermissionRepository.delete({ roleId });

    if (permissions.length > 0) {
      await this.rolePermissionRepository.save(
        permissions.map((permission) =>
          this.rolePermissionRepository.create({
            roleId,
            permissionId: permission.id,
          }),
        ),
      );
    }

    return {
      success: true,
      data: {
        id: role.id,
        permissions: permissions.map((permission) => permission.code),
      },
    };
  }

  async listPermissions(query: RbacPermissionQueryDto) {
    const sortMap: Record<string, string> = {
      createdAt: 'permission.createdAt',
      updatedAt: 'permission.updatedAt',
      name: 'permission.name',
      code: 'permission.code',
      module: 'permission.module',
    };
    const sortBy = sortMap[query.sort ?? 'createdAt'] ?? 'permission.createdAt';

    const qb = this.permissionRepository
      .createQueryBuilder('permission')
      .orderBy(sortBy, query.order ?? 'DESC')
      .skip(((query.page ?? 1) - 1) * (query.limit ?? 20))
      .take(query.limit ?? 20);

    if (query.keyword) {
      qb.andWhere(
        '(permission.name ILIKE :keyword OR permission.code ILIKE :keyword OR permission.description ILIKE :keyword)',
        { keyword: `%${query.keyword}%` },
      );
    }

    if (query.module) {
      qb.andWhere('permission.module ILIKE :module', {
        module: `%${query.module}%`,
      });
    }

    const [permissions, total] = await qb.getManyAndCount();

    return {
      success: true,
      data: {
        items: permissions,
        meta: {
          total,
          page: query.page ?? 1,
          limit: query.limit ?? 20,
        },
      },
    };
  }

  async createPermission(dto: CreatePermissionDto, creatorId: string) {
    const existing = await this.permissionRepository.findOne({
      where: { code: dto.code.trim() },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(`Permission already exists: ${dto.code}`);
    }

    const permission = await this.permissionRepository.save(
      this.permissionRepository.create({
        code: dto.code.trim(),
        name: dto.name.trim(),
        module: dto.module?.trim() ?? null,
        description: dto.description?.trim() ?? null,
        createdById: creatorId,
      }),
    );

    return {
      success: true,
      data: permission,
    };
  }

  async updatePermission(id: string, dto: UpdatePermissionDto) {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    if (dto.code && dto.code.trim() !== permission.code) {
      const exists = await this.permissionRepository.findOne({
        where: { code: dto.code.trim() },
        select: { id: true },
      });
      if (exists) {
        throw new ConflictException(`Permission already exists: ${dto.code}`);
      }
      permission.code = dto.code.trim();
    }

    permission.name = dto.name?.trim() ?? permission.name;
    permission.module =
      dto.module !== undefined
        ? (dto.module?.trim() ?? null)
        : permission.module;
    permission.description =
      dto.description !== undefined
        ? (dto.description?.trim() ?? null)
        : permission.description;

    await this.permissionRepository.save(permission);

    return {
      success: true,
      data: permission,
    };
  }

  async deletePermission(id: string) {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    // Keep the first implementation simple: if permissions are referenced,
    // the DB cascade handles the cleanup after explicit deletion.

    await this.permissionRepository.delete(id);

    return {
      success: true,
    };
  }

  async listUsers(query: RbacUserQueryDto) {
    const sortMap: Record<string, string> = {
      createdAt: 'user.createdAt',
      updatedAt: 'user.updatedAt',
      name: 'user.name',
      email: 'user.email',
      status: 'user.status',
      lastLoginAt: 'user.lastLoginAt',
    };
    const sortBy = sortMap[query.sort ?? 'createdAt'] ?? 'user.createdAt';

    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userRoles', 'userRole')
      .leftJoinAndSelect('userRole.role', 'role')
      .distinct(true)
      .orderBy(sortBy, query.order ?? 'DESC')
      .skip(((query.page ?? 1) - 1) * (query.limit ?? 20))
      .take(query.limit ?? 20);

    if (query.keyword) {
      qb.andWhere('(user.name ILIKE :keyword OR user.email ILIKE :keyword)', {
        keyword: `%${query.keyword}%`,
      });
    }

    if (query.role) {
      qb.andWhere('role.code = :roleCode', { roleCode: query.role });
    }

    if (query.status) {
      qb.andWhere('user.status = :status', {
        status: query.status as UserStatus,
      });
    } else {
      // Hide soft-deleted users by default in admin list.
      qb.andWhere('user.status != :deletedStatus', {
        deletedStatus: UserStatus.DELETED,
      });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      success: true,
      data: {
        items: items.map((user) => ({
          id: user.id,
          email: user.email,
          name: user.name,
          status: user.status,
          roles: (user.userRoles ?? []).map((userRole) => userRole.role.code),
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })),
        meta: {
          total,
          page: query.page ?? 1,
          limit: query.limit ?? 20,
        },
      },
    };
  }

  async createUser(dto: CreateAdminUserDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const exists = await this.userRepository.findOne({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (exists) {
      throw new ConflictException('Email already exists');
    }

    const user = await this.userRepository.save(
      this.userRepository.create({
        name: dto.name.trim(),
        email: normalizedEmail,
        passwordHash: await HashHelper.hash(dto.password),
        status: dto.status ?? UserStatus.ACTIVE,
      }),
    );

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status,
        createdAt: user.createdAt,
      },
    };
  }

  async updateUser(userId: string, dto: UpdateAdminUserDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.email) {
      const normalizedEmail = dto.email.trim().toLowerCase();
      if (normalizedEmail !== user.email) {
        const exists = await this.userRepository.findOne({
          where: { email: normalizedEmail },
          select: { id: true },
        });
        if (exists) {
          throw new ConflictException('Email already exists');
        }
        user.email = normalizedEmail;
      }
    }

    if (dto.name !== undefined) {
      user.name = dto.name.trim();
    }

    if (dto.status !== undefined) {
      user.status = dto.status;
    }

    if (dto.password !== undefined) {
      const trimmedPassword = dto.password.trim();
      if (!trimmedPassword) {
        throw new BadRequestException('Password cannot be empty');
      }
      user.passwordHash = await HashHelper.hash(trimmedPassword);
    }

    await this.userRepository.save(user);

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status,
        updatedAt: user.updatedAt,
      },
    };
  }

  async deleteUser(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.status = UserStatus.DELETED;
    await this.userRepository.save(user);

    return {
      success: true,
      data: { id: user.id, status: user.status },
    };
  }

  async replaceUserRoles(userId: string, dto: ReplaceUserRolesDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { userRoles: { role: true } },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const normalizedRoles = Array.from(new Set(dto.roles));
    const roles = await this.roleRepository.find({
      where: normalizedRoles.map((code) => ({ code })),
    });

    if (roles.length !== normalizedRoles.length) {
      const missing = normalizedRoles.filter(
        (code) => !roles.some((role) => role.code === code),
      );
      throw new BadRequestException(
        `Missing role codes: ${missing.join(', ')}`,
      );
    }

    await this.userRoleRepository.delete({ userId });

    await this.userRoleRepository.save(
      roles.map((role) =>
        this.userRoleRepository.create({
          userId,
          roleId: role.id,
        }),
      ),
    );

    const refreshed = await this.userRepository.findOne({
      where: { id: userId },
      relations: { userRoles: { role: true } },
    });

    return {
      success: true,
      data: {
        id: refreshed?.id,
        roles: (refreshed?.userRoles ?? []).map((item) => item.role.code),
      },
    };
  }
}
