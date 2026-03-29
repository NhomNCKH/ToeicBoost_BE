import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/constants/user.enum';
import { LearnerExamTemplateQueryDto } from './dto/exam-attempt.dto';
import { ExamAttemptService } from './exam-attempt.service';

@ApiTags('Learner Exam Template')
@ApiBearerAuth()
@Roles(UserRole.LEARNER, UserRole.ADMIN, UserRole.SUPERADMIN)
@Controller('learner/exam-templates')
export class LearnerExamTemplateController {
  constructor(private readonly examAttemptService: ExamAttemptService) {}

  @Get()
  @ApiOperation({ summary: 'Lay danh sach mau de thi da publish cho learner' })
  listPublishedTemplates(@Query() query: LearnerExamTemplateQueryDto) {
    return this.examAttemptService.listPublishedTemplates(query);
  }
}
