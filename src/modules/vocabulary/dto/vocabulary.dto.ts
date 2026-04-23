import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '@common/dto/pagination-query.dto';

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;
export type CefrLevelDto = (typeof CEFR_LEVELS)[number];

export class AdminListVocabularyDecksQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: CEFR_LEVELS })
  @IsOptional()
  @IsIn([...CEFR_LEVELS])
  cefrLevel?: CefrLevelDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  keyword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  published?: boolean;
}

export class LearnerListVocabularyDecksQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: CEFR_LEVELS })
  @IsOptional()
  @IsIn([...CEFR_LEVELS])
  cefrLevel?: CefrLevelDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  keyword?: string;
}

export class CreateVocabularyDeckDto {
  @ApiProperty({ example: 'Từ vựng A1 — Giao tiếp cơ bản' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ enum: CEFR_LEVELS, example: 'A1' })
  @IsIn([...CEFR_LEVELS])
  cefrLevel: CefrLevelDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  published?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateVocabularyDeckDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ enum: CEFR_LEVELS })
  @IsOptional()
  @IsIn([...CEFR_LEVELS])
  cefrLevel?: CefrLevelDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  published?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class CreateVocabularyItemDto {
  @ApiProperty({ example: 'water' })
  @IsString()
  @MaxLength(200)
  word: string;

  @ApiProperty({ example: 'noun' })
  @IsString()
  @MaxLength(50)
  wordType: string;

  @ApiProperty({ example: 'nước' })
  @IsString()
  @MaxLength(5000)
  meaning: string;

  @ApiPropertyOptional({ example: '/ˈwɔːtər/' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  pronunciation?: string | null;

  @ApiProperty({ example: 'Please drink some water before the meeting.' })
  @IsString()
  @MaxLength(5000)
  exampleSentence: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateVocabularyItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  word?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  wordType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  meaning?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  pronunciation?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  exampleSentence?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class AdminListVocabularyItemsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  keyword?: string;
}

export class LearnerListVocabularyItemsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  keyword?: string;
}

export class BulkCreateVocabularyItemsDto {
  @ApiProperty({ type: [CreateVocabularyItemDto], maxItems: 500 })
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => CreateVocabularyItemDto)
  items: CreateVocabularyItemDto[];
}
