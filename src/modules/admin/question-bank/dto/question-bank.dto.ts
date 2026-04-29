import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AssetKind,
  QuestionGroupStatus,
  QuestionLevel,
  QuestionPart,
} from '@common/constants/question-bank.enum';
import { PaginationQueryDto } from '@common/dto/pagination-query.dto';

export class TagDto {
  @ApiProperty({ example: 'grammar' })
  @IsString()
  @MaxLength(50)
  category: string;

  @ApiProperty({ example: 'grammar:tense' })
  @IsString()
  @MaxLength(100)
  code: string;

  @ApiProperty({ example: 'Tense' })
  @IsString()
  @MaxLength(255)
  label: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateTagDto extends PartialType(TagDto) {}

export class QuestionOptionDto {
  @ApiProperty({ example: 'A' })
  @IsString()
  @MaxLength(10)
  optionKey: string;

  @ApiProperty({ example: 'The meeting was postponed.' })
  @IsString()
  content: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  isCorrect: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class QuestionItemDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  questionNo: number;

  @ApiProperty({ example: 'What does the man mean?' })
  @IsString()
  prompt: string;

  @ApiProperty({ example: 'B' })
  @IsString()
  @MaxLength(10)
  answerKey: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rationale?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  timeLimitSec?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  scoreWeight?: number;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiProperty({ type: [QuestionOptionDto] })
  @IsArray()
  @ArrayMinSize(4)
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options: QuestionOptionDto[];
}

export class QuestionGroupAssetDto {
  @ApiProperty({ enum: AssetKind })
  @IsEnum(AssetKind)
  kind: AssetKind;

  @ApiProperty({ example: 'question-bank/P3/grp-001/audio.mp3' })
  @IsString()
  @MaxLength(500)
  storageKey: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  publicUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  mimeType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  durationSec?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contentText?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class CreateQuestionGroupDto {
  @ApiProperty({ example: 'QB-P5-0001' })
  @IsString()
  @Length(3, 50)
  code: string;

  @ApiProperty({ example: 'Part 5 - Tense - Easy 01' })
  @IsString()
  @Length(3, 255)
  title: string;

  @ApiProperty({ enum: QuestionPart })
  @IsEnum(QuestionPart)
  part: QuestionPart;

  @ApiProperty({ enum: QuestionLevel })
  @IsEnum(QuestionLevel)
  level: QuestionLevel;

  @ApiPropertyOptional({ enum: QuestionGroupStatus })
  @IsOptional()
  @IsEnum(QuestionGroupStatus)
  status?: QuestionGroupStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stem?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({ example: 'manual' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  sourceType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  sourceRef?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ type: [String], example: ['grammar:tense'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagCodes?: string[];

  @ApiPropertyOptional({ type: [QuestionGroupAssetDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionGroupAssetDto)
  assets?: QuestionGroupAssetDto[];

  @ApiProperty({ type: [QuestionItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuestionItemDto)
  questions: QuestionItemDto[];
}

export class UpdateQuestionGroupDto extends PartialType(
  CreateQuestionGroupDto,
) {}

export class QuestionGroupQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: QuestionPart })
  @IsOptional()
  @IsEnum(QuestionPart)
  part?: QuestionPart;

  @ApiPropertyOptional({ enum: QuestionLevel })
  @IsOptional()
  @IsEnum(QuestionLevel)
  level?: QuestionLevel;

  @ApiPropertyOptional({ enum: QuestionGroupStatus })
  @IsOptional()
  @IsEnum(QuestionGroupStatus)
  status?: QuestionGroupStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  createdBy?: string;

  @ApiPropertyOptional({
    description:
      'Chỉ lấy nhóm câu hỏi objective dùng cho Listening/Reading (có câu hỏi và mỗi câu có >= 2 đáp án)',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  objectiveOnly?: boolean = true;
}

export class BulkTagQuestionGroupsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID(undefined, { each: true })
  questionGroupIds: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  tagCodes: string[];
}

export class BulkStatusQuestionGroupsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID(undefined, { each: true })
  questionGroupIds: string[];

  @ApiProperty({ enum: QuestionGroupStatus })
  @IsEnum(QuestionGroupStatus)
  status: QuestionGroupStatus;
}

export class ReviewQuestionGroupDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}

export class PresignQuestionGroupAssetDto {
  @ApiProperty({ enum: AssetKind })
  @IsEnum(AssetKind)
  kind: AssetKind;

  @ApiProperty({ example: 'audio/mpeg' })
  @IsString()
  contentType: string;

  @ApiPropertyOptional({ example: 'conversation-01.mp3' })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(60)
  expiresInSeconds?: number;
}

export class AttachQuestionGroupAssetDto extends QuestionGroupAssetDto {}

export class PresignQuestionGroupImportDto {
  @ApiProperty({ example: 'application/json' })
  @IsString()
  contentType: string;

  @ApiPropertyOptional({ example: 'question-bank-import.json' })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(60)
  expiresInSeconds?: number;
}

export class ImportQuestionGroupsDto {
  @ApiProperty({ type: [CreateQuestionGroupDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionGroupDto)
  groups: CreateQuestionGroupDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceFileName?: string;
}
