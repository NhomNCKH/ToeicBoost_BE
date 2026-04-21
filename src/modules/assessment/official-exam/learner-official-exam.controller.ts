import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/constants/user.enum';
import { Request } from 'express';
import { OfficialExamService } from './official-exam.service';
import { RegisterOfficialExamDto } from './dto/official-exam.dto';

@ApiTags('Learner Official Exam')
@ApiBearerAuth()
@Roles(UserRole.LEARNER, UserRole.ADMIN, UserRole.SUPERADMIN)
@Controller('learner/official-exams')
export class LearnerOfficialExamController {
  constructor(private readonly officialExamService: OfficialExamService) {}

  @Get('sessions')
  @ApiOperation({
    summary:
      'Lay danh sach suat thi (official_exam) co examDate de learner lua chon',
  })
  listSessions() {
    return this.officialExamService.listAvailableSessions();
  }

  @Post('registrations')
  @ApiOperation({ summary: 'Dang ky suat thi official exam theo template' })
  register(@Body() dto: RegisterOfficialExamDto, @Req() req: Request) {
    const userId = (req as any).user?.sub as string;
    return this.officialExamService.register(userId, dto.examTemplateId);
  }

  @Get('registrations')
  @ApiOperation({ summary: 'Lay lich su dang ky thi official exam cua learner' })
  listMyRegistrations(@Req() req: Request) {
    const userId = (req as any).user?.sub as string;
    return this.officialExamService.listMyRegistrations(userId);
  }
}

