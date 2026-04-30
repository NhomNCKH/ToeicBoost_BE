import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '@common/decorators/permissions.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { PermissionCode } from '@common/constants/permission.enum';
import { UserRole } from '@common/constants/user.enum';
import { AdminDashboardService } from './admin-dashboard.service';

@ApiTags('Admin Dashboard')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Lấy dữ liệu tổng quan dashboard quản trị' })
  @Permissions(PermissionCode.DASHBOARD_VIEW)
  getSummary() {
    return this.adminDashboardService.getSummary();
  }
}
