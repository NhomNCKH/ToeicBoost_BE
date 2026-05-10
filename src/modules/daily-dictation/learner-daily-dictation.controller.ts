import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/constants/user.enum';
import { LearnerListDailyDictationQueryDto } from './dto/daily-dictation.dto';
import { DailyDictationService } from './daily-dictation.service';

@ApiTags('Learner Daily Dictation')
@ApiBearerAuth()
@Roles(UserRole.LEARNER)
@Controller('learner/daily-dictation')
export class LearnerDailyDictationController {
  constructor(private readonly dailyDictation: DailyDictationService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách DailyDictation đã publish (learner)' })
  list(@Query() query: LearnerListDailyDictationQueryDto) {
    const page = Number(query.page ?? 1) || 1;
    const limit = Number(query.limit ?? 20) || 20;
    return this.dailyDictation.learnerList({
      page,
      limit,
      keyword: query.keyword,
      level: query.level,
      topic: query.topic,
      sort: query.sort,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết DailyDictation + segments (learner)' })
  getDetail(@Param('id') id: string) {
    return this.dailyDictation.learnerGetDetail(id);
  }
}
