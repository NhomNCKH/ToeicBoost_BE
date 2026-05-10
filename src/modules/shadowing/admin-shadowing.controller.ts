import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/constants/user.enum';
import { ShadowingService } from './shadowing.service';
import {
  AdminImportYoutubeShadowingDto,
  AdminListShadowingQueryDto,
  AdminReplaceShadowingSegmentsDto,
  AdminUpdateShadowingContentDto,
} from './dto/shadowing.dto';

@ApiTags('Admin Shadowing')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/shadowing')
export class AdminShadowingController {
  constructor(private readonly shadowing: ShadowingService) {}

  @Post('import-youtube')
  @ApiOperation({ summary: 'Import Shadowing từ YouTube captions' })
  importYoutube(@Body() dto: AdminImportYoutubeShadowingDto) {
    return this.shadowing.adminImportFromYoutube(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách nội dung Shadowing (admin)' })
  list(@Query() query: AdminListShadowingQueryDto) {
    const page = Number(query.page ?? 1) || 1;
    const limit = Number(query.limit ?? 20) || 20;
    return this.shadowing.adminList({
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
    return this.shadowing.adminGetDetail(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa nội dung shadowing (hard delete)' })
  delete(@Param('id') id: string) {
    return this.shadowing.adminDeleteContent(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật metadata nội dung (admin)' })
  updateContent(@Param('id') id: string, @Body() dto: AdminUpdateShadowingContentDto) {
    return this.shadowing.adminUpdateContent(id, dto);
  }

  @Put(':id/segments')
  @ApiOperation({ summary: 'Replace segments cho content (admin)' })
  replaceSegments(@Param('id') id: string, @Body() dto: AdminReplaceShadowingSegmentsDto) {
    return this.shadowing.adminReplaceSegments(id, dto.segments ?? []);
  }

  @Post(':id/reimport-en')
  @ApiOperation({ summary: 'Re-import captions tiếng Anh và rebuild segments' })
  reimportEnglish(@Param('id') id: string) {
    return this.shadowing.adminReimportEnglishCaptions(id);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish nội dung shadowing' })
  publish(@Param('id') id: string) {
    return this.shadowing.adminPublish(id);
  }

  @Post(':id/translate')
  @ApiOperation({ summary: 'Chạy dịch EN→VI cho segments (best-effort)' })
  translate(@Param('id') id: string) {
    return this.shadowing.translateContentSegments(id);
  }
}

