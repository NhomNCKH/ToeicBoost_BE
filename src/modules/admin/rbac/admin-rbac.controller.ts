import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '@common/decorators/roles.decorator';
import { Permissions } from '@common/decorators/permissions.decorator';
import { UserInfo } from '@common/decorators/user-info.decorator';
import { PermissionCode } from '@common/constants/permission.enum';
import { UserRole } from '@common/constants/user.enum';
import { IJwtPayload } from '@common/interfaces/jwt-payload.interface';
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
import { AdminRbacService } from './admin-rbac.service';

@ApiTags('Admin RBAC')
@ApiBearerAuth()
@Roles(UserRole.SUPERADMIN)
@Controller('admin/rbac')
export class AdminRbacController {
  constructor(private readonly adminRbacService: AdminRbacService) {}

  @Get('roles')
  @ApiOperation({ summary: 'Lấy danh sách vai trò' })
  @Permissions(PermissionCode.ROLES_READ)
  listRoles(@Query() query: RbacRoleQueryDto) {
    return this.adminRbacService.listRoles(query);
  }

  @Post('roles')
  @ApiOperation({ summary: 'Tạo vai trò mới' })
  @Permissions(PermissionCode.ROLES_MANAGE)
  createRole(@Body() dto: CreateRoleDto, @UserInfo() userInfo: IJwtPayload) {
    return this.adminRbacService.createRole(dto, userInfo.sub);
  }

  @Patch('roles/:id')
  @ApiOperation({ summary: 'Cập nhật vai trò' })
  @Permissions(PermissionCode.ROLES_MANAGE)
  updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.adminRbacService.updateRole(id, dto);
  }

  @Delete('roles/:id')
  @ApiOperation({ summary: 'Xóa vai trò' })
  @Permissions(PermissionCode.ROLES_MANAGE)
  deleteRole(@Param('id') id: string) {
    return this.adminRbacService.deleteRole(id);
  }

  @Patch('roles/:id/permissions')
  @ApiOperation({ summary: 'Gán lại quyền cho vai trò' })
  @Permissions(PermissionCode.ROLES_MANAGE, PermissionCode.PERMISSIONS_MANAGE)
  replaceRolePermissions(
    @Param('id') id: string,
    @Body() dto: ReplaceRolePermissionsDto,
  ) {
    return this.adminRbacService.replaceRolePermissions(id, dto);
  }

  @Get('permissions')
  @ApiOperation({ summary: 'Lấy danh sách quyền' })
  @Permissions(PermissionCode.PERMISSIONS_READ)
  listPermissions(@Query() query: RbacPermissionQueryDto) {
    return this.adminRbacService.listPermissions(query);
  }

  @Post('permissions')
  @ApiOperation({ summary: 'Tạo quyền mới' })
  @Permissions(PermissionCode.PERMISSIONS_MANAGE)
  createPermission(
    @Body() dto: CreatePermissionDto,
    @UserInfo() userInfo: IJwtPayload,
  ) {
    return this.adminRbacService.createPermission(dto, userInfo.sub);
  }

  @Patch('permissions/:id')
  @ApiOperation({ summary: 'Cập nhật quyền' })
  @Permissions(PermissionCode.PERMISSIONS_MANAGE)
  updatePermission(@Param('id') id: string, @Body() dto: UpdatePermissionDto) {
    return this.adminRbacService.updatePermission(id, dto);
  }

  @Delete('permissions/:id')
  @ApiOperation({ summary: 'Xóa quyền' })
  @Permissions(PermissionCode.PERMISSIONS_MANAGE)
  deletePermission(@Param('id') id: string) {
    return this.adminRbacService.deletePermission(id);
  }

  @Get('users')
  @ApiOperation({ summary: 'Lấy danh sách người dùng kèm vai trò' })
  @Permissions(PermissionCode.USERS_READ)
  listUsers(@Query() query: RbacUserQueryDto) {
    return this.adminRbacService.listUsers(query);
  }

  @Post('users')
  @ApiOperation({ summary: 'Tạo người dùng quản trị' })
  @Permissions(PermissionCode.USERS_MANAGE)
  createUser(@Body() dto: CreateAdminUserDto) {
    return this.adminRbacService.createUser(dto);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Cập nhật người dùng' })
  @Permissions(PermissionCode.USERS_MANAGE)
  updateUser(@Param('id') id: string, @Body() dto: UpdateAdminUserDto) {
    return this.adminRbacService.updateUser(id, dto);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Xóa mềm người dùng' })
  @Permissions(PermissionCode.USERS_MANAGE)
  deleteUser(@Param('id') id: string) {
    return this.adminRbacService.deleteUser(id);
  }

  @Patch('users/:id/roles')
  @ApiOperation({ summary: 'Gán lại vai trò cho người dùng' })
  @Permissions(PermissionCode.USERS_MANAGE)
  replaceUserRoles(@Param('id') id: string, @Body() dto: ReplaceUserRolesDto) {
    return this.adminRbacService.replaceUserRoles(id, dto);
  }
}
