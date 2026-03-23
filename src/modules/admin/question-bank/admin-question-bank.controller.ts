import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '@common/decorators/roles.decorator';
import { UserInfo } from '@common/decorators/user-info.decorator';
import { UserRole } from '@common/constants/user.enum';
import { IJwtPayload } from '@common/interfaces/jwt-payload.interface';
import { AdminQuestionBankService } from './admin-question-bank.service';
import {
  AttachQuestionGroupAssetDto,
  BulkStatusQuestionGroupsDto,
  BulkTagQuestionGroupsDto,
  CreateQuestionGroupDto,
  ImportQuestionGroupsDto,
  PresignQuestionGroupAssetDto,
  PresignQuestionGroupImportDto,
  QuestionGroupQueryDto,
  ReviewQuestionGroupDto,
  TagDto,
  UpdateQuestionGroupDto,
  UpdateTagDto,
} from './dto/question-bank.dto';

@ApiTags('Admin Question Bank')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminQuestionBankController {
  constructor(
    private readonly adminQuestionBankService: AdminQuestionBankService,
  ) {}

  @Get('tags')
  @ApiOperation({ summary: 'Lấy danh sách tag quản trị' })
  listTags() {
    return this.adminQuestionBankService.listTags();
  }

  @Post('tags')
  @ApiOperation({ summary: 'Tạo tag quản trị' })
  createTag(@Body() dto: TagDto, @UserInfo() userInfo: IJwtPayload) {
    return this.adminQuestionBankService.createTag(dto, userInfo.sub);
  }

  @Patch('tags/:id')
  @ApiOperation({ summary: 'Cập nhật tag quản trị' })
  updateTag(@Param('id') id: string, @Body() dto: UpdateTagDto) {
    return this.adminQuestionBankService.updateTag(id, dto);
  }

  @Delete('tags/:id')
  @ApiOperation({ summary: 'Xóa tag quản trị' })
  deleteTag(@Param('id') id: string) {
    return this.adminQuestionBankService.deleteTag(id);
  }

  @Get('question-groups')
  @ApiOperation({ summary: 'Lấy danh sách nhóm câu hỏi' })
  listQuestionGroups(@Query() query: QuestionGroupQueryDto) {
    return this.adminQuestionBankService.listQuestionGroups(query);
  }

  @Post('question-groups')
  @ApiOperation({ summary: 'Tạo nhóm câu hỏi' })
  createQuestionGroup(
    @Body() dto: CreateQuestionGroupDto,
    @UserInfo() userInfo: IJwtPayload,
  ) {
    return this.adminQuestionBankService.createQuestionGroup(dto, userInfo.sub);
  }

  @Get('question-groups/:id')
  @ApiOperation({ summary: 'Lấy chi tiết nhóm câu hỏi' })
  getQuestionGroup(@Param('id') id: string) {
    return this.adminQuestionBankService.getQuestionGroupDetail(id);
  }

  @Patch('question-groups/:id')
  @ApiOperation({ summary: 'Cập nhật nhóm câu hỏi' })
  updateQuestionGroup(
    @Param('id') id: string,
    @Body() dto: UpdateQuestionGroupDto,
    @UserInfo() userInfo: IJwtPayload,
  ) {
    return this.adminQuestionBankService.updateQuestionGroup(
      id,
      dto,
      userInfo.sub,
    );
  }

  @Delete('question-groups/:id')
  @ApiOperation({ summary: 'Xóa mềm nhóm câu hỏi' })
  deleteQuestionGroup(
    @Param('id') id: string,
    @UserInfo() userInfo: IJwtPayload,
  ) {
    return this.adminQuestionBankService.deleteQuestionGroup(id, userInfo.sub);
  }

  @Post('question-groups/:id/submit-review')
  @ApiOperation({ summary: 'Gửi nhóm câu hỏi để duyệt' })
  submitReview(
    @Param('id') id: string,
    @UserInfo() userInfo: IJwtPayload,
    @Body() dto: ReviewQuestionGroupDto,
  ) {
    return this.adminQuestionBankService.submitReview(id, userInfo.sub, dto);
  }

  @Post('question-groups/:id/approve')
  @ApiOperation({ summary: 'Duyệt nhóm câu hỏi' })
  approve(
    @Param('id') id: string,
    @UserInfo() userInfo: IJwtPayload,
    @Body() dto: ReviewQuestionGroupDto,
  ) {
    return this.adminQuestionBankService.approve(id, userInfo.sub, dto);
  }

  @Post('question-groups/:id/reject')
  @ApiOperation({ summary: 'Từ chối duyệt nhóm câu hỏi' })
  reject(
    @Param('id') id: string,
    @UserInfo() userInfo: IJwtPayload,
    @Body() dto: ReviewQuestionGroupDto,
  ) {
    return this.adminQuestionBankService.reject(id, userInfo.sub, dto);
  }

  @Post('question-groups/:id/publish')
  @ApiOperation({ summary: 'Xuất bản nhóm câu hỏi' })
  publish(
    @Param('id') id: string,
    @UserInfo() userInfo: IJwtPayload,
    @Body() dto: ReviewQuestionGroupDto,
  ) {
    return this.adminQuestionBankService.publish(id, userInfo.sub, dto);
  }

  @Post('question-groups/:id/archive')
  @ApiOperation({ summary: 'Lưu trữ nhóm câu hỏi' })
  archive(
    @Param('id') id: string,
    @UserInfo() userInfo: IJwtPayload,
    @Body() dto: ReviewQuestionGroupDto,
  ) {
    return this.adminQuestionBankService.archive(id, userInfo.sub, dto);
  }

  @Post('question-groups/bulk-tag')
  @ApiOperation({ summary: 'Gắn tag hàng loạt cho nhóm câu hỏi' })
  bulkTag(
    @Body() dto: BulkTagQuestionGroupsDto,
    @UserInfo() userInfo: IJwtPayload,
  ) {
    return this.adminQuestionBankService.bulkTag(dto, userInfo.sub);
  }

  @Post('question-groups/bulk-status')
  @ApiOperation({ summary: 'Cập nhật trạng thái hàng loạt cho nhóm câu hỏi' })
  bulkStatus(
    @Body() dto: BulkStatusQuestionGroupsDto,
    @UserInfo() userInfo: IJwtPayload,
  ) {
    return this.adminQuestionBankService.bulkStatus(dto, userInfo.sub);
  }

  @Post('question-groups/import/presign')
  @ApiOperation({
    summary: 'Tạo URL pre-signed để tải file import ngân hàng câu hỏi',
  })
  presignImport(
    @Body() dto: PresignQuestionGroupImportDto,
    @UserInfo() userInfo: IJwtPayload,
  ) {
    return this.adminQuestionBankService.presignImport(userInfo.sub, dto);
  }

  @Post('question-groups/import/preview')
  @ApiOperation({
    summary: 'Xem trước dữ liệu import đã chuẩn hóa cho ngân hàng câu hỏi',
  })
  previewImport(@Body() dto: ImportQuestionGroupsDto) {
    return this.adminQuestionBankService.previewImport(dto);
  }

  @Post('question-groups/import/commit')
  @ApiOperation({
    summary: 'Lưu dữ liệu import đã chuẩn hóa vào ngân hàng câu hỏi',
  })
  commitImport(
    @Body() dto: ImportQuestionGroupsDto,
    @UserInfo() userInfo: IJwtPayload,
  ) {
    return this.adminQuestionBankService.commitImport(dto, userInfo.sub);
  }

  @Post('question-groups/:id/assets/presign')
  @ApiOperation({
    summary: 'Tạo URL pre-signed để tải tài nguyên cho nhóm câu hỏi',
  })
  presignAsset(
    @Param('id') id: string,
    @Body() dto: PresignQuestionGroupAssetDto,
  ) {
    return this.adminQuestionBankService.presignAsset(id, dto);
  }

  @Post('question-groups/:id/assets')
  @ApiOperation({ summary: 'Gắn tài nguyên đã tải lên vào nhóm câu hỏi' })
  attachAsset(
    @Param('id') id: string,
    @Body() dto: AttachQuestionGroupAssetDto,
    @UserInfo() userInfo: IJwtPayload,
  ) {
    return this.adminQuestionBankService.attachAsset(id, dto, userInfo.sub);
  }

  @Delete('question-groups/:id/assets/:assetId')
  @ApiOperation({ summary: 'Xóa tài nguyên của nhóm câu hỏi' })
  deleteAsset(@Param('id') id: string, @Param('assetId') assetId: string) {
    return this.adminQuestionBankService.deleteAsset(id, assetId);
  }
}
