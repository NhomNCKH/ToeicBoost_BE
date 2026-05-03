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
import {
  CreateFlashcardDeckDto,
  CreateFlashcardDto,
  LearnerBulkCreateFlashcardsDto,
  LearnerListDeckFlashcardsQueryDto,
  LearnerListDecksQueryDto,
  LearnerPreviewFlashcardsFromAiDto,
  LearnerPreviewFlashcardsFromJsonDto,
  LearnerStudyQueueQueryDto,
  LearnerSubmitReviewDto,
  UpdateFlashcardDeckDto,
  UpdateFlashcardDto,
} from './dto/flashcards.dto';
import { FlashcardsService } from './flashcards.service';

@ApiTags('Learner Flashcards')
@ApiBearerAuth()
@Roles(UserRole.LEARNER, UserRole.ADMIN, UserRole.SUPERADMIN)
@Controller('learner/flashcard-decks')
export class FlashcardsController {
  constructor(private readonly flashcardsService: FlashcardsService) {}

  @Get()
  @ApiOperation({ summary: 'List flashcard decks (learner)' })
  listDecks(@Query() query: LearnerListDecksQueryDto, @UserInfo() userInfo: IJwtPayload) {
    return this.flashcardsService.listDecks(query, userInfo.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Create a flashcard deck' })
  createDeck(@Body() dto: CreateFlashcardDeckDto, @UserInfo() userInfo: IJwtPayload) {
    return this.flashcardsService.createDeck(dto, userInfo.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get deck detail' })
  getDeck(@Param('id') id: string, @UserInfo() userInfo: IJwtPayload) {
    return this.flashcardsService.getDeck(id, userInfo.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update deck' })
  updateDeck(
    @Param('id') id: string,
    @Body() dto: UpdateFlashcardDeckDto,
    @UserInfo() userInfo: IJwtPayload,
  ) {
    return this.flashcardsService.updateDeck(id, dto, userInfo.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete deck (soft delete)' })
  deleteDeck(@Param('id') id: string, @UserInfo() userInfo: IJwtPayload) {
    return this.flashcardsService.deleteDeck(id, userInfo.sub);
  }

  @Get(':id/flashcards')
  @ApiOperation({ summary: 'List flashcards in a deck' })
  listDeckCards(
    @Param('id') id: string,
    @Query() query: LearnerListDeckFlashcardsQueryDto,
    @UserInfo() userInfo: IJwtPayload,
  ) {
    return this.flashcardsService.listDeckCards(id, query, userInfo.sub);
  }

  @Post(':id/flashcards')
  @ApiOperation({ summary: 'Create flashcard in deck' })
  createCard(
    @Param('id') id: string,
    @Body() dto: CreateFlashcardDto,
    @UserInfo() userInfo: IJwtPayload,
  ) {
    return this.flashcardsService.createCard(id, dto, userInfo.sub);
  }

  @Post(':id/flashcards/bulk')
  @ApiOperation({ summary: 'Bulk create flashcards in deck after preview confirmation' })
  bulkCreateCards(
    @Param('id') id: string,
    @Body() dto: LearnerBulkCreateFlashcardsDto,
    @UserInfo() userInfo: IJwtPayload,
  ) {
    return this.flashcardsService.bulkCreateCards(id, dto, userInfo.sub);
  }
}

@ApiTags('Learner Flashcards')
@ApiBearerAuth()
@Roles(UserRole.LEARNER, UserRole.ADMIN, UserRole.SUPERADMIN)
@Controller('learner/flashcards')
export class LearnerFlashcardsController {
  constructor(private readonly flashcardsService: FlashcardsService) {}

  @Patch(':id')
  @ApiOperation({ summary: 'Update flashcard' })
  updateCard(
    @Param('id') id: string,
    @Body() dto: UpdateFlashcardDto,
    @UserInfo() userInfo: IJwtPayload,
  ) {
    return this.flashcardsService.updateCard(id, dto, userInfo.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete flashcard (soft delete)' })
  deleteCard(@Param('id') id: string, @UserInfo() userInfo: IJwtPayload) {
    return this.flashcardsService.deleteCard(id, userInfo.sub);
  }

  @Post('preview-from-json')
  @ApiOperation({ summary: 'Preview flashcards from pasted JSON without saving to DB' })
  previewFromJson(@Body() dto: LearnerPreviewFlashcardsFromJsonDto) {
    return this.flashcardsService.previewFromJson(dto);
  }

  @Post('preview-from-ai')
  @ApiOperation({ summary: 'Generate, validate, and preview flashcards from AI without saving to DB' })
  previewFromAi(@Body() dto: LearnerPreviewFlashcardsFromAiDto) {
    return this.flashcardsService.previewFromAi(dto);
  }

  @Get('study/queue')
  @ApiOperation({ summary: 'Get study queue (due + new)' })
  getQueue(@Query() query: LearnerStudyQueueQueryDto, @UserInfo() userInfo: IJwtPayload) {
    return this.flashcardsService.getStudyQueue(query, userInfo.sub);
  }

  @Post('study/review')
  @ApiOperation({ summary: 'Submit a review rating' })
  submitReview(@Body() dto: LearnerSubmitReviewDto, @UserInfo() userInfo: IJwtPayload) {
    return this.flashcardsService.submitReview(dto, userInfo.sub);
  }
}
