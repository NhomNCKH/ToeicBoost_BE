import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '@common/decorators/roles.decorator';
import { UserInfo } from '@common/decorators/user-info.decorator';
import { UserRole } from '@common/constants/user.enum';
import { IJwtPayload } from '@common/interfaces/jwt-payload.interface';
import { AdminExamTemplateService } from './admin-exam-template.service';
import {
  AddManualExamTemplateItemsDto,
  AutoFillExamTemplateItemsDto,
  CreateExamTemplateDto,
  ExamTemplateQueryDto,
  PutExamTemplateRulesDto,
  PutExamTemplateSectionsDto,
  ReorderExamTemplateItemsDto,
  UpdateExamTemplateDto,
} from './dto/exam-template.dto';

@ApiTags('Admin Exam Template')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/exam-templates')
export class AdminExamTemplateController {
  constructor(
    private readonly adminExamTemplateService: AdminExamTemplateService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách mẫu đề thi' })
  listTemplates(@Query() query: ExamTemplateQueryDto) {
    return this.adminExamTemplateService.listTemplates(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Lấy thống kê tổng quan mẫu đề thi' })
  getTemplateStats() {
    return this.adminExamTemplateService.getTemplateStats();
  }

  @Post()
  @ApiOperation({ summary: 'Tạo mẫu đề thi' })
  createTemplate(
    @Body() dto: CreateExamTemplateDto,
    @UserInfo() userInfo: IJwtPayload,
  ) {
    return this.adminExamTemplateService.createTemplate(dto, userInfo.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết mẫu đề thi' })
  getTemplate(@Param('id') id: string) {
    return this.adminExamTemplateService.getTemplateDetail(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật mẫu đề thi' })
  updateTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateExamTemplateDto,
    @UserInfo() userInfo: IJwtPayload,
  ) {
    return this.adminExamTemplateService.updateTemplate(id, dto, userInfo.sub);
  }

  @Delete(':id')
  @ApiOperation({
    summary:
      'Xóa mẫu đề thi (mọi trạng thái); xóa luôn các bài làm liên quan nếu có',
  })
  deleteTemplate(@Param('id') id: string) {
    return this.adminExamTemplateService.deleteTemplate(id);
  }

  @Put(':id/sections')
  @ApiOperation({ summary: 'Thay thế các phần của mẫu đề thi' })
  replaceSections(
    @Param('id') id: string,
    @Body() dto: PutExamTemplateSectionsDto,
    @UserInfo() userInfo: IJwtPayload,
  ) {
    return this.adminExamTemplateService.replaceSections(id, dto, userInfo.sub);
  }

  @Put(':id/rules')
  @ApiOperation({ summary: 'Thay thế các rule của mẫu đề thi' })
  replaceRules(
    @Param('id') id: string,
    @Body() dto: PutExamTemplateRulesDto,
    @UserInfo() userInfo: IJwtPayload,
  ) {
    return this.adminExamTemplateService.replaceRules(id, dto, userInfo.sub);
  }

  @Post(':id/items/manual')
  @ApiOperation({ summary: 'Gắn thủ công nhóm câu hỏi vào mẫu đề thi' })
  addManualItems(
    @Param('id') id: string,
    @Body() dto: AddManualExamTemplateItemsDto,
    @UserInfo() userInfo: IJwtPayload,
  ) {
    return this.adminExamTemplateService.addManualItems(id, dto, userInfo.sub);
  }

  @Patch(':id/items/reorder')
  @ApiOperation({ summary: 'Sắp xếp lại thứ tự item trong mẫu đề thi' })
  reorderItems(
    @Param('id') id: string,
    @Body() dto: ReorderExamTemplateItemsDto,
    @UserInfo() userInfo: IJwtPayload,
  ) {
    return this.adminExamTemplateService.reorderItems(id, dto, userInfo.sub);
  }

  @Delete(':id/items/:itemId')
  @ApiOperation({ summary: 'Xóa item khỏi mẫu đề thi' })
  deleteItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @UserInfo() userInfo: IJwtPayload,
  ) {
    return this.adminExamTemplateService.deleteItem(id, itemId, userInfo.sub);
  }

  @Post(':id/items/auto-fill')
  @ApiOperation({
    summary: 'Tự động điền item vào mẫu đề thi theo rule của ngân hàng câu hỏi',
  })
  autoFillItems(
    @Param('id') id: string,
    @Body() dto: AutoFillExamTemplateItemsDto,
    @UserInfo() userInfo: IJwtPayload,
  ) {
    return this.adminExamTemplateService.autoFillItems(id, dto, userInfo.sub);
  }

  @Post(':id/validate')
  @ApiOperation({ summary: 'Kiểm tra tính hợp lệ của mẫu đề thi' })
  validateTemplate(@Param('id') id: string) {
    return this.adminExamTemplateService.validateTemplate(id);
  }

  @Get(':id/preview')
  @ApiOperation({ summary: 'Xem trước mẫu đề thi kèm kết quả kiểm tra' })
  previewTemplate(@Param('id') id: string) {
    return this.adminExamTemplateService.previewTemplate(id);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Xuất bản mẫu đề thi' })
  publishTemplate(@Param('id') id: string, @UserInfo() userInfo: IJwtPayload) {
    return this.adminExamTemplateService.publishTemplate(id, userInfo.sub);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Lưu trữ mẫu đề thi' })
  archiveTemplate(@Param('id') id: string, @UserInfo() userInfo: IJwtPayload) {
    return this.adminExamTemplateService.archiveTemplate(id, userInfo.sub);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Nhân bản mẫu đề thi' })
  duplicateTemplate(
    @Param('id') id: string,
    @UserInfo() userInfo: IJwtPayload,
  ) {
    return this.adminExamTemplateService.duplicateTemplate(id, userInfo.sub);
  }
}
