import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateNested,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '@common/dto/pagination-query.dto';
import { QuestionLevel } from '@common/constants/question-bank.enum';
import {
  SkillTaskStatus,
  ToeicSpeakingTaskType,
  ToeicWritingTaskType,
} from '@common/constants/skill-task.enum';

export class SkillTaskQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: QuestionLevel })
  @IsOptional()
  @IsEnum(QuestionLevel)
  level?: QuestionLevel;

  @ApiPropertyOptional({ enum: SkillTaskStatus })
  @IsOptional()
  @IsEnum(SkillTaskStatus)
  status?: SkillTaskStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;
}

export class CreateToeicWritingTaskDto {
  @ApiProperty({ example: 'TW-P2-0001' })
  @IsString()
  @Length(3, 60)
  code: string;

  @ApiProperty({ example: 'Part 2 — Email response (Customer service)' })
  @IsString()
  @Length(3, 255)
  title: string;

  @ApiProperty({ enum: ToeicWritingTaskType })
  @IsEnum(ToeicWritingTaskType)
  taskType: ToeicWritingTaskType;

  @ApiProperty({ enum: QuestionLevel })
  @IsEnum(QuestionLevel)
  level: QuestionLevel;

  @ApiPropertyOptional({ enum: SkillTaskStatus })
  @IsOptional()
  @IsEnum(SkillTaskStatus)
  status?: SkillTaskStatus;

  @ApiProperty()
  @IsString()
  prompt: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2000)
  minWords?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5000)
  maxWords?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60 * 60)
  timeLimitSec?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  tips?: string[];

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  rubric?: Record<string, unknown>;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdateToeicWritingTaskDto extends PartialType(CreateToeicWritingTaskDto) {}

export class CreateToeicSpeakingTaskDto {
  @ApiProperty({ example: 'TS-READ-0001' })
  @IsString()
  @Length(3, 60)
  code: string;

  @ApiProperty({ example: 'Part 1 — Read aloud (Office hours)' })
  @IsString()
  @Length(3, 255)
  title: string;

  @ApiProperty({ enum: ToeicSpeakingTaskType })
  @IsEnum(ToeicSpeakingTaskType)
  taskType: ToeicSpeakingTaskType;

  @ApiProperty({ enum: QuestionLevel })
  @IsEnum(QuestionLevel)
  level: QuestionLevel;

  @ApiPropertyOptional({ enum: SkillTaskStatus })
  @IsOptional()
  @IsEnum(SkillTaskStatus)
  status?: SkillTaskStatus;

  @ApiProperty()
  @IsString()
  prompt: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60 * 60)
  targetSeconds?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60 * 60)
  timeLimitSec?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  tips?: string[];

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  rubric?: Record<string, unknown>;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdateToeicSpeakingTaskDto extends PartialType(CreateToeicSpeakingTaskDto) {}

export class CreateToeicSpeakingSetDto {
  @ApiProperty({ example: 'TS-SET-0001' })
  @IsString()
  @Length(3, 60)
  code: string;

  @ApiProperty({ example: 'Bộ đề TOEIC Speaking — Tháng 5' })
  @IsString()
  @Length(3, 255)
  title: string;

  @ApiProperty({ enum: QuestionLevel })
  @IsEnum(QuestionLevel)
  level: QuestionLevel;

  @ApiPropertyOptional({ enum: SkillTaskStatus })
  @IsOptional()
  @IsEnum(SkillTaskStatus)
  status?: SkillTaskStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60 * 60)
  timeLimitSec?: number;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdateToeicSpeakingSetDto extends PartialType(CreateToeicSpeakingSetDto) {}

export class AddToeicSpeakingSetItemsDto {
  @ApiProperty({ type: [String], description: 'List of taskIds to add' })
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  taskIds: string[];
}

export class CreateToeicWritingSetDto {
  @ApiProperty({ example: 'TW-SET-0001' })
  @IsString()
  @Length(3, 60)
  code: string;

  @ApiProperty({ example: 'Bộ đề TOEIC Writing — Tháng 5' })
  @IsString()
  @Length(3, 255)
  title: string;

  @ApiProperty({ enum: QuestionLevel })
  @IsEnum(QuestionLevel)
  level: QuestionLevel;

  @ApiPropertyOptional({ enum: SkillTaskStatus })
  @IsOptional()
  @IsEnum(SkillTaskStatus)
  status?: SkillTaskStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60 * 60 * 3)
  timeLimitSec?: number;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdateToeicWritingSetDto extends PartialType(CreateToeicWritingSetDto) {}

export class AddToeicWritingSetItemsDto {
  @ApiProperty({ type: [String], description: 'List of taskIds to add' })
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID('4', { each: true })
  taskIds: string[];
}

