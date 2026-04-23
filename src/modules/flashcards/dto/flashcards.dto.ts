import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '@common/dto/pagination-query.dto';

export class LearnerListDecksQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'toeic' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  keyword?: string;
}

export class CreateFlashcardDeckDto {
  @ApiProperty({ example: 'TOEIC Core 600' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'Từ vựng trọng tâm' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

export class UpdateFlashcardDeckDto {
  @ApiPropertyOptional({ example: 'TOEIC Core 600 (updated)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: 'Mô tả mới' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

export class LearnerListDeckFlashcardsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'meeting' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  keyword?: string;

  @ApiPropertyOptional({ example: ['business', 'toeic'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class CreateFlashcardDto {
  @ApiProperty({ example: 'attend' })
  @IsString()
  @MaxLength(2000)
  front: string;

  @ApiProperty({ example: 'tham dự' })
  @IsString()
  @MaxLength(5000)
  back: string;

  @ApiPropertyOptional({ example: 'attend a meeting' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  note?: string;

  @ApiPropertyOptional({ example: ['toeic', 'business'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateFlashcardDto {
  @ApiPropertyOptional({ example: 'attend' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  front?: string;

  @ApiPropertyOptional({ example: 'tham dự' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  back?: string;

  @ApiPropertyOptional({ example: 'attend a meeting' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  note?: string;

  @ApiPropertyOptional({ example: ['toeic', 'business'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class LearnerStudyQueueQueryDto {
  @ApiProperty({ example: 'uuid-deck-id' })
  @IsUUID()
  deckId: string;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  newLimit?: number;
}

export class LearnerSubmitReviewDto {
  @ApiProperty({ example: 'uuid-flashcard-id' })
  @IsUUID()
  flashcardId: string;

  @ApiProperty({ enum: ['again', 'hard', 'good', 'easy'] })
  @IsIn(['again', 'hard', 'good', 'easy'])
  rating: 'again' | 'hard' | 'good' | 'easy';

  @ApiPropertyOptional({ example: 1200 })
  @IsOptional()
  @IsInt()
  @Min(0)
  timeMs?: number;
}

