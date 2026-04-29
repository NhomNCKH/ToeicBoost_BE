import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

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

