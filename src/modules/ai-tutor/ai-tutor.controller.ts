import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/constants/user.enum';
import { AiTutorService } from './ai-tutor.service';
import {
  ExplainAnswerDto,
  GradeSpeakingDto,
  GradeWritingDto,
  GenerateTranslationExerciseDto,
  LookupVocabularyDto,
  ReviewTranslationDto,
  SuggestTranslationDto,
} from './dto/ai-tutor.dto';

@ApiTags('Learner AI Tutor (Groq)')
@ApiBearerAuth()
@Roles(UserRole.LEARNER, UserRole.ADMIN, UserRole.SUPERADMIN)
@Controller('learner/ai')
export class AiTutorController {
  constructor(private readonly aiTutorService: AiTutorService) {}

  @Post('explain')
  @ApiOperation({ summary: 'Giải thích đáp án (Listening/Reading)' })
  explain(@Body() dto: ExplainAnswerDto) {
    return this.aiTutorService.explain(dto);
  }

  @Post('writing/grade')
  @ApiOperation({ summary: 'Chấm Writing (MVP: trả về JSON text)' })
  gradeWriting(@Body() dto: GradeWritingDto) {
    return this.aiTutorService.gradeWriting(dto);
  }

  @Post('speaking/grade')
  @ApiOperation({ summary: 'Chấm Speaking từ transcript (MVP)' })
  gradeSpeaking(@Body() dto: GradeSpeakingDto) {
    return this.aiTutorService.gradeSpeaking(dto);
  }

  @Post('vocabulary/lookup')
  @ApiOperation({ summary: 'Tra từ vựng nhanh bằng AI từ đoạn bôi đen' })
  lookupVocabulary(@Body() dto: LookupVocabularyDto) {
    return this.aiTutorService.lookupVocabulary(dto);
  }

  @Post('translation/generate')
  @ApiOperation({ summary: 'Tạo bài luyện dịch (AI)' })
  generateTranslationExercise(@Body() dto: GenerateTranslationExerciseDto) {
    return this.aiTutorService.generateTranslationExercise(dto);
  }

  @Post('translation/suggest')
  @ApiOperation({ summary: 'Gợi ý từ vựng/cấu trúc cho bài dịch' })
  suggestTranslation(@Body() dto: SuggestTranslationDto) {
    return this.aiTutorService.suggestTranslation(dto);
  }

  @Post('translation/review')
  @ApiOperation({ summary: 'Chấm & nhận xét bài dịch' })
  reviewTranslation(@Body() dto: ReviewTranslationDto) {
    return this.aiTutorService.reviewTranslation(dto);
  }
}

