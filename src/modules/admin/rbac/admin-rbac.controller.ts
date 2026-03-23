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
import { UserInfo } from '@common/decorators/user-info.decorator';
import { UserRole } from '@common/constants/user.enum';
import { IJwtPayload } from '@common/interfaces/jwt-payload.interface';
import {
  CreatePermissionDto,
  CreateRoleDto,
  RbacUserQueryDto,
  ReplaceUserRolesDto,
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
  listRoles() {
    return this.adminRbacService.listRoles();
  }

  @Post('roles')
  @ApiOperation({ summary: 'Tạo vai trò mới' })
  createRole(@Body() dto: CreateRoleDto, @UserInfo() userInfo: IJwtPayload) {
    return this.adminRbacService.createRole(dto, userInfo.sub);
  }

  @Patch('roles/:id')
  @ApiOperation({ summary: 'Cập nhật vai trò' })
  updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.adminRbacService.updateRole(id, dto);
  }

  @Delete('roles/:id')
  @ApiOperation({ summary: 'Xóa vai trò' })
  deleteRole(@Param('id') id: string) {
    return this.adminRbacService.deleteRole(id);
  }

  @Get('permissions')
  @ApiOperation({ summary: 'Lấy danh sách quyền' })
  listPermissions() {
    return this.adminRbacService.listPermissions();
  }

  @Post('permissions')
  @ApiOperation({ summary: 'Tạo quyền mới' })
  createPermission(
    @Body() dto: CreatePermissionDto,
    @UserInfo() userInfo: IJwtPayload,
  ) {
    return this.adminRbacService.createPermission(dto, userInfo.sub);
  }

  @Patch('permissions/:id')
  @ApiOperation({ summary: 'Cập nhật quyền' })
  updatePermission(@Param('id') id: string, @Body() dto: UpdatePermissionDto) {
    return this.adminRbacService.updatePermission(id, dto);
  }

  @Delete('permissions/:id')
  @ApiOperation({ summary: 'Xóa quyền' })
  deletePermission(@Param('id') id: string) {
    return this.adminRbacService.deletePermission(id);
  }

  @Get('users')
  @ApiOperation({ summary: 'Lấy danh sách người dùng kèm vai trò' })
  listUsers(@Query() query: RbacUserQueryDto) {
    return this.adminRbacService.listUsers(query);
  }

  @Patch('users/:id/roles')
  @ApiOperation({ summary: 'Gán lại vai trò cho người dùng' })
  replaceUserRoles(@Param('id') id: string, @Body() dto: ReplaceUserRolesDto) {
    return this.adminRbacService.replaceUserRoles(id, dto);
  }
}
