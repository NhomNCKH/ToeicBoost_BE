import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/constants/user.enum';
import { LearnerListShadowingQueryDto } from './dto/shadowing.dto';
import { ShadowingService } from './shadowing.service';

@ApiTags('Learner Shadowing')
@ApiBearerAuth()
@Roles(UserRole.LEARNER)
@Controller('learner/shadowing')
export class LearnerShadowingController {
  constructor(private readonly shadowing: ShadowingService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách Shadowing đã publish (learner)' })
  list(@Query() query: LearnerListShadowingQueryDto) {
    const page = Number(query.page ?? 1) || 1;
    const limit = Number(query.limit ?? 20) || 20;
    return this.shadowing.learnerList({
      page,
      limit,
      keyword: query.keyword,
      level: query.level,
      topic: query.topic,
      sort: query.sort,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết Shadowing + segments (learner)' })
  getDetail(@Param('id') id: string) {
    return this.shadowing.learnerGetDetail(id);
  }
}

