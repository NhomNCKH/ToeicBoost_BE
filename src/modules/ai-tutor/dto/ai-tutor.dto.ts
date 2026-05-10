import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export enum AiSkill {
  LISTENING = 'listening',
  READING = 'reading',
  WRITING = 'writing',
  SPEAKING = 'speaking',
}

export class ExplainAnswerDto {
  @ApiProperty({ enum: AiSkill })
  @IsEnum(AiSkill)
  skill: AiSkill;

  @ApiProperty({
    description:
      'Ngữ cảnh câu hỏi (passage / transcript / question). Không bắt buộc đầy đủ ở MVP.',
  })
  @IsString()
  question: string;

  @ApiPropertyOptional({ description: 'Đáp án người học chọn/nhập' })
  @IsOptional()
  @IsString()
  userAnswer?: string;

  @ApiPropertyOptional({ description: 'Đáp án đúng (nếu có ở phía FE/BE)' })
  @IsOptional()
  @IsString()
  correctAnswer?: string;

  @ApiPropertyOptional({ description: 'Giải thích mong muốn (vi/eng)' })
  @IsOptional()
  @IsString()
  language?: string;
}

export class GradeWritingDto {
  @ApiProperty({ description: 'Đề bài (task prompt)' })
  @IsString()
  prompt: string;

  @ApiProperty({ description: 'Bài viết của người học' })
  @IsString()
  essay: string;

  @ApiPropertyOptional({ description: 'Ngôn ngữ phản hồi (vi/eng)' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    description:
      'Task type / part code của bài writing (ví dụ: part1_sentence, part2_email, part3_essay)',
  })
  @IsOptional()
  @IsString()
  taskType?: string;
}

export class GradeSpeakingDto {
  @ApiProperty({ description: 'Đề bài nói (task prompt)' })
  @IsString()
  prompt: string;

  @ApiProperty({
    description:
      'Transcript do browser STT trả về (MVP). Ở phase sau có thể gửi audio lên để chấm phát âm.',
  })
  @IsString()
  transcript: string;

  @ApiPropertyOptional({
    description:
      'Thời lượng nói (giây) nếu FE đo được, giúp feedback sát hơn (tùy chọn)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3600)
  durationSeconds?: number;

  @ApiPropertyOptional({ description: 'Ngôn ngữ phản hồi (vi/eng)' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    description:
      'Task type / part code của bài speaking (ví dụ: read_aloud, describe_picture, respond_to_questions...)',
  })
  @IsOptional()
  @IsString()
  taskType?: string;
}

export class LookupVocabularyDto {
  @ApiProperty({ description: 'Từ/cụm từ người học đã bôi đen' })
  @IsString()
  expression: string;

  @ApiPropertyOptional({
    description: 'Ngữ cảnh xung quanh (passage/transcript/stem) để AI hiểu đúng nghĩa',
  })
  @IsOptional()
  @IsString()
  context?: string;

  @ApiPropertyOptional({ description: 'Ngôn ngữ phản hồi (vi/eng)' })
  @IsOptional()
  @IsString()
  language?: string;
}

export class GenerateTranslationExerciseDto {
  @ApiPropertyOptional({
    description: 'Ngôn ngữ nguồn (ví dụ: en, vi). Mặc định: en',
  })
  @IsOptional()
  @IsString()
  sourceLanguage?: string;

  @ApiPropertyOptional({
    description: 'Ngôn ngữ đích (ví dụ: vi, en). Mặc định: vi',
  })
  @IsOptional()
  @IsString()
  targetLanguage?: string;

  @ApiPropertyOptional({
    description: 'Độ khó (easy|medium|hard hoặc chuỗi tự do)',
  })
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiPropertyOptional({
    description: 'Mục đích học (toeic|communication|work hoặc chuỗi tự do)',
  })
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiPropertyOptional({ description: 'Chủ đề chọn sẵn' })
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional({ description: 'Chủ đề tự nhập' })
  @IsOptional()
  @IsString()
  customTopic?: string;

  @ApiPropertyOptional({
    description: 'Dạng bài (dialogue|paragraph). Mặc định: paragraph',
  })
  @IsOptional()
  @IsIn(['dialogue', 'paragraph'])
  exerciseType?: 'dialogue' | 'paragraph';
}

export class SuggestTranslationDto {
  @ApiProperty({ description: 'Đoạn gốc cần dịch' })
  @IsString()
  sourceText: string;

  @ApiPropertyOptional({
    description:
      'Bài dịch của người học (tùy chọn). Nếu không gửi, API sẽ trả gợi ý dựa trên câu gốc để tham khảo trước khi dịch.',
  })
  @IsOptional()
  @IsString()
  translation?: string;

  @ApiPropertyOptional({ description: 'Ngôn ngữ đích (ví dụ: vi, en)' })
  @IsOptional()
  @IsString()
  targetLanguage?: string;
}

export class ReviewTranslationDto {
  @ApiProperty({ description: 'Đoạn gốc cần dịch' })
  @IsString()
  sourceText: string;

  @ApiProperty({ description: 'Bài dịch của người học' })
  @IsString()
  translation: string;

  @ApiPropertyOptional({ description: 'Ngôn ngữ đích (ví dụ: vi, en)' })
  @IsOptional()
  @IsString()
  targetLanguage?: string;
}

