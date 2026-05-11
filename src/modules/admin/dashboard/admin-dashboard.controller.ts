import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '@common/decorators/permissions.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { PermissionCode } from '@common/constants/permission.enum';
import { UserRole } from '@common/constants/user.enum';
import { AdminDashboardService } from './admin-dashboard.service';
import { OfficialResultsQueryDto } from './dto/official-results-query.dto';
import { RegistrationsQueryDto } from './dto/registrations-query.dto';

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

  @Get('official-results')
  @ApiOperation({ summary: 'Lấy danh sách kết quả thi chính thức cho trang chứng chỉ' })
  @Permissions(PermissionCode.CREDENTIALS_MANAGE)
  getOfficialResults(@Query() query: OfficialResultsQueryDto) {
    return this.adminDashboardService.getOfficialResults(query);
  }

  @Get('registrations')
  @ApiOperation({
    summary: 'Lấy danh sách học viên đã đăng ký thi chính thức',
  })
  @Permissions(PermissionCode.CREDENTIALS_MANAGE)
  listRegistrations(@Query() query: RegistrationsQueryDto) {
    return this.adminDashboardService.listRegistrations(query);
  }

  @Post('official-results/:attemptId/issue')
  @ApiOperation({ summary: 'Cap chung chi cho mot bai thi chinh thuc du dieu kien' })
  @Permissions(PermissionCode.CREDENTIALS_MANAGE)
  issueCredential(
    @Param('attemptId') attemptId: string,
    @CurrentUser('sub') adminUserId: string,
  ) {
    return this.adminDashboardService.issueCertificateForAttempt(
      attemptId,
      adminUserId,
    );
  }

  @Get('notifications/read-state')
  @ApiOperation({ summary: 'Lay moc da doc thong bao dashboard cua admin' })
  @Permissions(PermissionCode.DASHBOARD_VIEW)
  getNotificationReadState(@CurrentUser('sub') adminUserId: string) {
    return this.adminDashboardService.getNotificationReadState(adminUserId);
  }

  @Post('notifications/read-state')
  @ApiOperation({ summary: 'Cap nhat moc da doc thong bao dashboard cua admin' })
  @Permissions(PermissionCode.DASHBOARD_VIEW)
  setNotificationReadState(
    @CurrentUser('sub') adminUserId: string,
    @Body()
    body: {
      proctoringTotal?: number;
      userTotal?: number;
    },
  ) {
    return this.adminDashboardService.setNotificationReadState(adminUserId, body ?? {});
  }
}
