import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/constants/user.enum';
import { AdminSkillTasksService } from './admin-skill-tasks.service';
import { SkillTaskQueryDto } from './dto/skill-tasks.dto';

@ApiTags('Learner Skill Tasks (Speaking/Writing)')
@ApiBearerAuth()
@Roles(UserRole.LEARNER, UserRole.ADMIN, UserRole.SUPERADMIN)
@Controller('learner')
export class LearnerSkillTasksController {
  constructor(private readonly service: AdminSkillTasksService) {}

  // ---- Speaking Sets (Published only) ----
  @Get('toeic-speaking-sets')
  @ApiOperation({ summary: 'Danh sách bộ đề TOEIC Speaking (đã xuất bản)' })
  listSpeakingSets(@Query() query: SkillTaskQueryDto) {
    return this.service.learnerListSpeakingSets(query);
  }

  @Get('toeic-speaking-sets/:id')
  @ApiOperation({ summary: 'Chi tiết bộ đề TOEIC Speaking (đã xuất bản)' })
  getSpeakingSet(@Param('id') id: string) {
    return this.service.learnerGetSpeakingSet(id);
  }

  // ---- Writing Sets (Published only) ----
  @Get('toeic-writing-sets')
  @ApiOperation({ summary: 'Danh sách bộ đề TOEIC Writing (đã xuất bản)' })
  listWritingSets(@Query() query: SkillTaskQueryDto) {
    return this.service.learnerListWritingSets(query);
  }

  @Get('toeic-writing-sets/:id')
  @ApiOperation({ summary: 'Chi tiết bộ đề TOEIC Writing (đã xuất bản)' })
  getWritingSet(@Param('id') id: string) {
    return this.service.learnerGetWritingSet(id);
  }
}

