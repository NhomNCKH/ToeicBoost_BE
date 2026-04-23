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
import { Permissions } from '@common/decorators/permissions.decorator';
import { UserInfo } from '@common/decorators/user-info.decorator';
import { PermissionCode } from '@common/constants/permission.enum';
import { UserRole } from '@common/constants/user.enum';
import { IJwtPayload } from '@common/interfaces/jwt-payload.interface';
import { VocabularyService } from './vocabulary.service';
import {
  AdminListVocabularyDecksQueryDto,
  AdminListVocabularyItemsQueryDto,
  BulkCreateVocabularyItemsDto,
  CreateVocabularyDeckDto,
  CreateVocabularyItemDto,
  UpdateVocabularyDeckDto,
  UpdateVocabularyItemDto,
} from './dto/vocabulary.dto';

@ApiTags('Admin Vocabulary')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/vocabulary-decks')
export class AdminVocabularyController {
  constructor(private readonly vocabularyService: VocabularyService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách bộ từ (admin)' })
  @Permissions(PermissionCode.VOCABULARY_MANAGE)
  listDecks(@Query() query: AdminListVocabularyDecksQueryDto, @UserInfo() user: IJwtPayload) {
    return this.vocabularyService.adminListDecks(query, user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo bộ từ' })
  @Permissions(PermissionCode.VOCABULARY_MANAGE)
  createDeck(@Body() dto: CreateVocabularyDeckDto, @UserInfo() user: IJwtPayload) {
    return this.vocabularyService.adminCreateDeck(dto, user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết bộ từ' })
  @Permissions(PermissionCode.VOCABULARY_MANAGE)
  getDeck(@Param('id') id: string) {
    return this.vocabularyService.adminGetDeck(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật bộ từ' })
  @Permissions(PermissionCode.VOCABULARY_MANAGE)
  updateDeck(
    @Param('id') id: string,
    @Body() dto: UpdateVocabularyDeckDto,
    @UserInfo() user: IJwtPayload,
  ) {
    return this.vocabularyService.adminUpdateDeck(id, dto, user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa mềm bộ từ' })
  @Permissions(PermissionCode.VOCABULARY_MANAGE)
  deleteDeck(@Param('id') id: string) {
    return this.vocabularyService.adminDeleteDeck(id);
  }

  @Get(':id/items')
  @ApiOperation({ summary: 'Danh sách từ trong bộ' })
  @Permissions(PermissionCode.VOCABULARY_MANAGE)
  listItems(@Param('id') id: string, @Query() query: AdminListVocabularyItemsQueryDto) {
    return this.vocabularyService.adminListItems(id, query);
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Thêm một từ' })
  @Permissions(PermissionCode.VOCABULARY_MANAGE)
  createItem(
    @Param('id') id: string,
    @Body() dto: CreateVocabularyItemDto,
    @UserInfo() user: IJwtPayload,
  ) {
    return this.vocabularyService.adminCreateItem(id, dto, user.sub);
  }

  @Post(':id/items/bulk')
  @ApiOperation({ summary: 'Thêm hàng loạt (tối đa 500)' })
  @Permissions(PermissionCode.VOCABULARY_MANAGE)
  bulkItems(
    @Param('id') id: string,
    @Body() dto: BulkCreateVocabularyItemsDto,
    @UserInfo() user: IJwtPayload,
  ) {
    return this.vocabularyService.adminBulkCreateItems(id, dto, user.sub);
  }

  @Patch(':deckId/items/:itemId')
  @ApiOperation({ summary: 'Cập nhật một từ' })
  @Permissions(PermissionCode.VOCABULARY_MANAGE)
  updateItem(
    @Param('deckId') deckId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateVocabularyItemDto,
    @UserInfo() user: IJwtPayload,
  ) {
    return this.vocabularyService.adminUpdateItem(deckId, itemId, dto, user.sub);
  }

  @Delete(':deckId/items/:itemId')
  @ApiOperation({ summary: 'Xóa mềm một từ' })
  @Permissions(PermissionCode.VOCABULARY_MANAGE)
  deleteItem(@Param('deckId') deckId: string, @Param('itemId') itemId: string) {
    return this.vocabularyService.adminDeleteItem(deckId, itemId);
  }
}
