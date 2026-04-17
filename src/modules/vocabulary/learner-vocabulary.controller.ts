import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/constants/user.enum';
import { VocabularyService } from './vocabulary.service';
import {
  LearnerListVocabularyDecksQueryDto,
  LearnerListVocabularyItemsQueryDto,
} from './dto/vocabulary.dto';

@ApiTags('Learner Vocabulary')
@ApiBearerAuth()
@Roles(UserRole.LEARNER, UserRole.ADMIN, UserRole.SUPERADMIN)
@Controller('learner/vocabulary-decks')
export class LearnerVocabularyController {
  constructor(private readonly vocabularyService: VocabularyService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách bộ từ đã xuất bản' })
  listDecks(@Query() query: LearnerListVocabularyDecksQueryDto) {
    return this.vocabularyService.learnerListDecks(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết bộ từ (đã xuất bản)' })
  getDeck(@Param('id') id: string) {
    return this.vocabularyService.learnerGetDeck(id);
  }

  @Get(':id/items')
  @ApiOperation({ summary: 'Danh sách từ trong bộ' })
  listItems(@Param('id') id: string, @Query() query: LearnerListVocabularyItemsQueryDto) {
    return this.vocabularyService.learnerListItems(id, query);
  }
}
