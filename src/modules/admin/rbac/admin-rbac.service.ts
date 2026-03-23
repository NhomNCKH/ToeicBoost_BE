import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@modules/security/entities/user.entity';
import { Permission } from './entities/permission.entity';
import { Role } from './entities/role.entity';
import { UserRoleAssignment } from './entities/user-role.entity';
import {
  CreatePermissionDto,
  CreateRoleDto,
  RbacUserQueryDto,
  ReplaceUserRolesDto,
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
    @InjectRepository(UserRoleAssignment)
    private readonly userRoleRepository: Repository<UserRoleAssignment>,
  ) {}

  async listRoles() {
    const roles = await this.roleRepository.find({
      order: { createdAt: 'ASC' },
      relations: { rolePermissions: { permission: true } },
    });

    return {
      success: true,
      data: roles,
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

  async listPermissions() {
    const permissions = await this.permissionRepository.find({
      order: { createdAt: 'ASC' },
    });

    return {
      success: true,
      data: permissions,
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
    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userRoles', 'userRole')
      .leftJoinAndSelect('userRole.role', 'role')
      .distinct(true)
      .orderBy(`user.${query.sort ?? 'createdAt'}`, query.order ?? 'DESC')
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
