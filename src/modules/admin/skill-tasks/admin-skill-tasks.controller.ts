import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '@common/decorators/roles.decorator';
import { Permissions } from '@common/decorators/permissions.decorator';
import { UserInfo } from '@common/decorators/user-info.decorator';
import { PermissionCode } from '@common/constants/permission.enum';
import { UserRole } from '@common/constants/user.enum';
import { IJwtPayload } from '@common/interfaces/jwt-payload.interface';
import { AdminSkillTasksService } from './admin-skill-tasks.service';
import {
  CreateToeicSpeakingTaskDto,
  CreateToeicSpeakingSetDto,
  CreateToeicWritingTaskDto,
  AddToeicSpeakingSetItemsDto,
  SkillTaskQueryDto,
  UpdateToeicSpeakingSetDto,
  UpdateToeicSpeakingTaskDto,
  UpdateToeicWritingTaskDto,
  CreateToeicWritingSetDto,
  UpdateToeicWritingSetDto,
  AddToeicWritingSetItemsDto,
} from './dto/skill-tasks.dto';

@ApiTags('Admin Skill Tasks (Speaking/Writing)')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminSkillTasksController {
  constructor(private readonly service: AdminSkillTasksService) {}

  // ---- Writing ----
  @Get('toeic-writing-tasks')
  @ApiOperation({ summary: 'List TOEIC Writing tasks' })
  @Permissions(PermissionCode.DASHBOARD_VIEW)
  listWriting(@Query() query: SkillTaskQueryDto) {
    return this.service.listWriting(query);
  }

  @Post('toeic-writing-tasks')
  @ApiOperation({ summary: 'Create TOEIC Writing task' })
  @Permissions(PermissionCode.DASHBOARD_VIEW)
  createWriting(@Body() dto: CreateToeicWritingTaskDto, @UserInfo() user: IJwtPayload) {
    return this.service.createWriting(dto, user.sub);
  }

  @Patch('toeic-writing-tasks/:id')
  @ApiOperation({ summary: 'Update TOEIC Writing task' })
  @Permissions(PermissionCode.DASHBOARD_VIEW)
  updateWriting(@Param('id') id: string, @Body() dto: UpdateToeicWritingTaskDto, @UserInfo() user: IJwtPayload) {
    return this.service.updateWriting(id, dto, user.sub);
  }

  @Delete('toeic-writing-tasks/:id')
  @ApiOperation({ summary: 'Delete TOEIC Writing task' })
  @Permissions(PermissionCode.DASHBOARD_VIEW)
  deleteWriting(@Param('id') id: string) {
    return this.service.deleteWriting(id);
  }

  // ---- Speaking ----
  @Get('toeic-speaking-tasks')
  @ApiOperation({ summary: 'List TOEIC Speaking tasks' })
  @Permissions(PermissionCode.DASHBOARD_VIEW)
  listSpeaking(@Query() query: SkillTaskQueryDto) {
    return this.service.listSpeaking(query);
  }

  @Post('toeic-speaking-tasks')
  @ApiOperation({ summary: 'Create TOEIC Speaking task' })
  @Permissions(PermissionCode.DASHBOARD_VIEW)
  createSpeaking(@Body() dto: CreateToeicSpeakingTaskDto, @UserInfo() user: IJwtPayload) {
    return this.service.createSpeaking(dto, user.sub);
  }

  @Patch('toeic-speaking-tasks/:id')
  @ApiOperation({ summary: 'Update TOEIC Speaking task' })
  @Permissions(PermissionCode.DASHBOARD_VIEW)
  updateSpeaking(@Param('id') id: string, @Body() dto: UpdateToeicSpeakingTaskDto, @UserInfo() user: IJwtPayload) {
    return this.service.updateSpeaking(id, dto, user.sub);
  }

  @Delete('toeic-speaking-tasks/:id')
  @ApiOperation({ summary: 'Delete TOEIC Speaking task' })
  @Permissions(PermissionCode.DASHBOARD_VIEW)
  deleteSpeaking(@Param('id') id: string) {
    return this.service.deleteSpeaking(id);
  }

  // ---- Speaking Sets (Bộ đề) ----
  @Get('toeic-speaking-sets')
  @ApiOperation({ summary: 'List TOEIC Speaking sets' })
  @Permissions(PermissionCode.DASHBOARD_VIEW)
  listSpeakingSets(@Query() query: SkillTaskQueryDto) {
    return this.service.listSpeakingSets(query);
  }

  @Post('toeic-speaking-sets')
  @ApiOperation({ summary: 'Create TOEIC Speaking set' })
  @Permissions(PermissionCode.DASHBOARD_VIEW)
  createSpeakingSet(@Body() dto: CreateToeicSpeakingSetDto, @UserInfo() user: IJwtPayload) {
    return this.service.createSpeakingSet(dto, user.sub);
  }

  @Get('toeic-speaking-sets/:id')
  @ApiOperation({ summary: 'Get TOEIC Speaking set detail' })
  @Permissions(PermissionCode.DASHBOARD_VIEW)
  getSpeakingSet(@Param('id') id: string) {
    return this.service.getSpeakingSet(id);
  }

  @Patch('toeic-speaking-sets/:id')
  @ApiOperation({ summary: 'Update TOEIC Speaking set' })
  @Permissions(PermissionCode.DASHBOARD_VIEW)
  updateSpeakingSet(@Param('id') id: string, @Body() dto: UpdateToeicSpeakingSetDto, @UserInfo() user: IJwtPayload) {
    return this.service.updateSpeakingSet(id, dto, user.sub);
  }

  @Delete('toeic-speaking-sets/:id')
  @ApiOperation({ summary: 'Delete TOEIC Speaking set' })
  @Permissions(PermissionCode.DASHBOARD_VIEW)
  deleteSpeakingSet(@Param('id') id: string) {
    return this.service.deleteSpeakingSet(id);
  }

  @Post('toeic-speaking-sets/:id/items')
  @ApiOperation({ summary: 'Add items (tasks) to TOEIC Speaking set' })
  @Permissions(PermissionCode.DASHBOARD_VIEW)
  addSpeakingSetItems(@Param('id') id: string, @Body() dto: AddToeicSpeakingSetItemsDto, @UserInfo() user: IJwtPayload) {
    return this.service.addSpeakingSetItems(id, dto.taskIds, user.sub);
  }

  @Delete('toeic-speaking-sets/:setId/items/:itemId')
  @ApiOperation({ summary: 'Remove item from TOEIC Speaking set' })
  @Permissions(PermissionCode.DASHBOARD_VIEW)
  removeSpeakingSetItem(@Param('setId') setId: string, @Param('itemId') itemId: string) {
    return this.service.removeSpeakingSetItem(setId, itemId);
  }

  // ---- Writing Sets (Bộ đề) ----
  @Get('toeic-writing-sets')
  @ApiOperation({ summary: 'List TOEIC Writing sets' })
  @Permissions(PermissionCode.DASHBOARD_VIEW)
  listWritingSets(@Query() query: SkillTaskQueryDto) {
    return this.service.listWritingSets(query);
  }

  @Post('toeic-writing-sets')
  @ApiOperation({ summary: 'Create TOEIC Writing set' })
  @Permissions(PermissionCode.DASHBOARD_VIEW)
  createWritingSet(@Body() dto: CreateToeicWritingSetDto, @UserInfo() user: IJwtPayload) {
    return this.service.createWritingSet(dto, user.sub);
  }

  @Get('toeic-writing-sets/:id')
  @ApiOperation({ summary: 'Get TOEIC Writing set detail' })
  @Permissions(PermissionCode.DASHBOARD_VIEW)
  getWritingSet(@Param('id') id: string) {
    return this.service.getWritingSet(id);
  }

  @Patch('toeic-writing-sets/:id')
  @ApiOperation({ summary: 'Update TOEIC Writing set' })
  @Permissions(PermissionCode.DASHBOARD_VIEW)
  updateWritingSet(@Param('id') id: string, @Body() dto: UpdateToeicWritingSetDto, @UserInfo() user: IJwtPayload) {
    return this.service.updateWritingSet(id, dto, user.sub);
  }

  @Delete('toeic-writing-sets/:id')
  @ApiOperation({ summary: 'Delete TOEIC Writing set' })
  @Permissions(PermissionCode.DASHBOARD_VIEW)
  deleteWritingSet(@Param('id') id: string) {
    return this.service.deleteWritingSet(id);
  }

  @Post('toeic-writing-sets/:id/items')
  @ApiOperation({ summary: 'Add items (tasks) to TOEIC Writing set' })
  @Permissions(PermissionCode.DASHBOARD_VIEW)
  addWritingSetItems(@Param('id') id: string, @Body() dto: AddToeicWritingSetItemsDto, @UserInfo() user: IJwtPayload) {
    return this.service.addWritingSetItems(id, dto.taskIds, user.sub);
  }

  @Delete('toeic-writing-sets/:setId/items/:itemId')
  @ApiOperation({ summary: 'Remove item from TOEIC Writing set' })
  @Permissions(PermissionCode.DASHBOARD_VIEW)
  removeWritingSetItem(@Param('setId') setId: string, @Param('itemId') itemId: string) {
    return this.service.removeWritingSetItem(setId, itemId);
  }
}

