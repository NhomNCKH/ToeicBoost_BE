import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
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

export const FLASHCARD_PREVIEW_LANGUAGES = ['en-vi', 'vi-en', 'en-en'] as const;
export const FLASHCARD_CONTENT_TYPES = [
  'vocabulary',
  'phrase',
  'collocation',
  'sentence',
  'mixed',
] as const;
export const FLASHCARD_SOURCES = ['manual', 'json_import', 'ai_generated'] as const;

export type FlashcardPreviewLanguage = (typeof FLASHCARD_PREVIEW_LANGUAGES)[number];
export type FlashcardContentType = (typeof FLASHCARD_CONTENT_TYPES)[number];
export type FlashcardSource = (typeof FLASHCARD_SOURCES)[number];

export class FlashcardMetadataDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1)
  version?: number;

  @ApiPropertyOptional({ example: 'attend' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  expression?: string;

  @ApiPropertyOptional({ example: 'verb' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  partOfSpeech?: string;

  @ApiPropertyOptional({ example: '/əˈtend/' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  pronunciation?: string;

  @ApiPropertyOptional({ example: 'tham dự' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  meaningVi?: string;

  @ApiPropertyOptional({ example: 'to be present at an event' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  meaningEn?: string;

  @ApiPropertyOptional({ example: ['look up to'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  phrasalVerbs?: string[];

  @ApiPropertyOptional({ example: ['join', 'participate in'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(12)
  synonyms?: string[];

  @ApiPropertyOptional({ example: ['skip', 'miss'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(12)
  antonyms?: string[];

  @ApiPropertyOptional({ example: 'She attended the weekly meeting.' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  exampleEn?: string;

  @ApiPropertyOptional({ example: 'Cô ấy tham dự cuộc họp hàng tuần.' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  exampleVi?: string;

  @ApiPropertyOptional({ example: 'Common TOEIC word for office context.' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  note?: string;

  @ApiPropertyOptional({ enum: FLASHCARD_SOURCES, example: 'ai_generated' })
  @IsOptional()
  @IsIn([...FLASHCARD_SOURCES])
  source?: FlashcardSource;

  @ApiPropertyOptional({ example: 'B1' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  level?: string;

  @ApiPropertyOptional({ enum: FLASHCARD_CONTENT_TYPES, example: 'phrase' })
  @IsOptional()
  @IsIn([...FLASHCARD_CONTENT_TYPES])
  contentType?: FlashcardContentType;

  @ApiPropertyOptional({ example: ['toeic', 'meeting', 'b1'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  tags?: string[];
}

export class FlashcardPreviewItemDto {
  @ApiProperty({ example: 'attend' })
  @IsString()
  @MaxLength(2000)
  front: string;

  @ApiProperty({ example: 'tham dự' })
  @IsString()
  @MaxLength(5000)
  back: string;

  @ApiPropertyOptional({ type: [String], example: ['toeic', 'meeting'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  tags?: string[];

  @ApiPropertyOptional({ type: () => FlashcardMetadataDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FlashcardMetadataDto)
  metadata?: FlashcardMetadataDto;

  @ApiPropertyOptional({
    example: 'Legacy text note. For AI/JSON flow, metadata is preferred over note text.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  note?: string;
}

export class LearnerPreviewFlashcardsFromJsonDto {
  @ApiProperty({
    example:
      '[{"front":"attend","back":"tham dự","metadata":{"partOfSpeech":"verb","pronunciation":"/əˈtend/"}}]',
  })
  @IsString()
  @MaxLength(200000)
  rawJson: string;
}

export class LearnerPreviewFlashcardsFromAiDto {
  @ApiProperty({ example: 'TOEIC meetings' })
  @IsString()
  @MaxLength(200)
  topic: string;

  @ApiProperty({ enum: FLASHCARD_PREVIEW_LANGUAGES, example: 'en-vi' })
  @IsIn([...FLASHCARD_PREVIEW_LANGUAGES])
  language: FlashcardPreviewLanguage;

  @ApiPropertyOptional({ example: 'B1' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  level?: string;

  @ApiProperty({ example: 15, minimum: 1, maximum: 50 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  cardCount: number;

  @ApiProperty({ enum: FLASHCARD_CONTENT_TYPES, example: 'phrase' })
  @IsIn([...FLASHCARD_CONTENT_TYPES])
  contentType: FlashcardContentType;

  @ApiPropertyOptional({
    example: 'Ưu tiên ngữ cảnh công việc, có ví dụ ngắn, tránh từ quá học thuật.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  requirements?: string;
}

export class LearnerBulkCreateFlashcardsDto {
  @ApiProperty({ type: [FlashcardPreviewItemDto], maxItems: 100 })
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => FlashcardPreviewItemDto)
  items: FlashcardPreviewItemDto[];
}
