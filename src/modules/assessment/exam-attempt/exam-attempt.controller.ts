import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '@common/decorators/roles.decorator';
import { UserInfo } from '@common/decorators/user-info.decorator';
import { UserRole } from '@common/constants/user.enum';
import { IJwtPayload } from '@common/interfaces/jwt-payload.interface';
import {
  SaveExamAttemptAnswersDto,
  StartExamAttemptDto,
  SubmitExamAttemptDto,
} from './dto/exam-attempt.dto';
import { ExamAttemptService } from './exam-attempt.service';

@ApiTags('Learner Exam Attempt')
@ApiBearerAuth()
@Roles(UserRole.LEARNER, UserRole.ADMIN, UserRole.SUPERADMIN)
@Controller('learner/exam-attempts')
export class ExamAttemptController {
  constructor(private readonly examAttemptService: ExamAttemptService) {}

  @Post()
  @ApiOperation({ summary: 'Bat dau hoac tiep tuc mot phien lam bai' })
  startAttempt(
    @Body() dto: StartExamAttemptDto,
    @UserInfo() userInfo: IJwtPayload,
  ): Promise<unknown> {
    return this.examAttemptService.startAttempt(dto, userInfo.sub);
  }

  @Put(':id/answers')
  @ApiOperation({ summary: 'Luu dap an tam thoi cho phien lam bai' })
  saveAnswers(
    @Param('id') id: string,
    @Body() dto: SaveExamAttemptAnswersDto,
    @UserInfo() userInfo: IJwtPayload,
  ): Promise<unknown> {
    return this.examAttemptService.saveAnswers(id, dto, userInfo.sub);
  }

  @Post(':id/submit')
  @ApiOperation({
    summary: 'Nop bai, cham diem va tu dong xet dieu kien chung chi',
  })
  submitAttempt(
    @Param('id') id: string,
    @Body() dto: SubmitExamAttemptDto,
    @UserInfo() userInfo: IJwtPayload,
  ): Promise<unknown> {
    return this.examAttemptService.submitAttempt(id, dto, userInfo.sub);
  }

  @Get(':id/result')
  @ApiOperation({ summary: 'Lay ket qua chi tiet cua phien lam bai' })
  getAttemptResult(
    @Param('id') id: string,
    @UserInfo() userInfo: IJwtPayload,
  ): Promise<unknown> {
    return this.examAttemptService.getAttemptResult(id, userInfo.sub);
  }
}
