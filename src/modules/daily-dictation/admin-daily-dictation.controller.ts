import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/constants/user.enum';
import { DailyDictationService } from './daily-dictation.service';
import {
  AdminImportYoutubeDailyDictationDto,
  AdminListDailyDictationQueryDto,
  AdminReplaceDailyDictationSegmentsDto,
  AdminUpdateDailyDictationContentDto,
} from './dto/daily-dictation.dto';

@ApiTags('Admin Daily Dictation')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/daily-dictation')
export class AdminDailyDictationController {
  constructor(private readonly dailyDictation: DailyDictationService) {}

  @Post('import-youtube')
  @ApiOperation({ summary: 'Import DailyDictation từ YouTube captions' })
  importYoutube(@Body() dto: AdminImportYoutubeDailyDictationDto) {
    return this.dailyDictation.adminImportFromYoutube(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách nội dung DailyDictation (admin)' })
  list(@Query() query: AdminListDailyDictationQueryDto) {
    const page = Number(query.page ?? 1) || 1;
    const limit = Number(query.limit ?? 20) || 20;
    return this.dailyDictation.adminList({
      page,
      limit,
      keyword: query.keyword,
      level: query.level,
      topic: query.topic,
      status: query.status,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết nội dung + segments (admin)' })
  getDetail(@Param('id') id: string) {
    return this.dailyDictation.adminGetDetail(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa nội dung daily dictation (hard delete)' })
  delete(@Param('id') id: string) {
    return this.dailyDictation.adminDeleteContent(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật metadata nội dung (admin)' })
  updateContent(@Param('id') id: string, @Body() dto: AdminUpdateDailyDictationContentDto) {
    return this.dailyDictation.adminUpdateContent(id, dto);
  }

  @Put(':id/segments')
  @ApiOperation({ summary: 'Replace segments cho content (admin)' })
  replaceSegments(@Param('id') id: string, @Body() dto: AdminReplaceDailyDictationSegmentsDto) {
    return this.dailyDictation.adminReplaceSegments(id, dto.segments ?? []);
  }

  @Post(':id/reimport-en')
  @ApiOperation({ summary: 'Re-import captions tiếng Anh và rebuild segments' })
  reimportEnglish(@Param('id') id: string) {
    return this.dailyDictation.adminReimportEnglishCaptions(id);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish nội dung DailyDictation' })
  publish(@Param('id') id: string) {
    return this.dailyDictation.adminPublish(id);
  }

  @Post(':id/translate')
  @ApiOperation({ summary: 'Chạy dịch EN→VI cho segments (best-effort)' })
  translate(@Param('id') id: string) {
    return this.dailyDictation.translateContentSegments(id);
  }
}
