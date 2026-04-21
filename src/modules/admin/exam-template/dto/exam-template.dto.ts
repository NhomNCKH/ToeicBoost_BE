import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsDateString,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '@common/dto/pagination-query.dto';
import {
  TemplateMode,
  TemplateStatus,
} from '@common/constants/exam-template.enum';
import { QuestionPart } from '@common/constants/question-bank.enum';

export class CreateExamTemplateDto {
  @ApiProperty({ example: 'MT-001' })
  @IsString()
  @Length(3, 50)
  code: string;

  @ApiProperty({ example: 'Mock Test 001' })
  @IsString()
  @Length(3, 255)
  name: string;

  @ApiProperty({ enum: TemplateMode })
  @IsEnum(TemplateMode)
  mode: TemplateMode;

  @ApiProperty({ example: 7200 })
  @IsInt()
  @Min(1)
  totalDurationSec: number;

  @ApiProperty({ example: 200 })
  @IsInt()
  @Min(1)
  totalQuestions: number;

  @ApiPropertyOptional({
    example: '2026-04-17',
    description: 'Ngày thi (chỉ dùng cho official_exam)',
  })
  @IsOptional()
  @IsDateString()
  examDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  shuffleQuestionOrder?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  shuffleOptionOrder?: boolean;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdateExamTemplateDto extends PartialType(CreateExamTemplateDto) {}

export class ExamTemplateQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TemplateMode })
  @IsOptional()
  @IsEnum(TemplateMode)
  mode?: TemplateMode;

  @ApiPropertyOptional({ enum: TemplateStatus })
  @IsOptional()
  @IsEnum(TemplateStatus)
  status?: TemplateStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;
}

export class ExamTemplateSectionDto {
  @ApiProperty({ enum: QuestionPart })
  @IsEnum(QuestionPart)
  part: QuestionPart;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  sectionOrder: number;

  @ApiProperty({ example: 13 })
  @IsInt()
  @Min(1)
  expectedGroupCount: number;

  @ApiProperty({ example: 39 })
  @IsInt()
  @Min(1)
  expectedQuestionCount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  durationSec?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instructions?: string;
}

export class PutExamTemplateSectionsDto {
  @ApiProperty({ type: [ExamTemplateSectionDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ExamTemplateSectionDto)
  sections: ExamTemplateSectionDto[];
}

export class ExamTemplateRuleDto {
  @ApiProperty({ enum: QuestionPart })
  @IsEnum(QuestionPart)
  part: QuestionPart;

  @ApiPropertyOptional({ type: Object, example: { easy: 2, medium: 4 } })
  @IsOptional()
  @IsObject()
  levelDistribution?: Record<string, number>;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredTagCodes?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludedTagCodes?: string[];

  @ApiProperty({ example: 39 })
  @IsInt()
  @Min(1)
  questionCount: number;

  @ApiPropertyOptional({ example: 13 })
  @IsOptional()
  @IsInt()
  @Min(1)
  groupCount?: number;
}

export class PutExamTemplateRulesDto {
  @ApiProperty({ type: [ExamTemplateRuleDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ExamTemplateRuleDto)
  rules: ExamTemplateRuleDto[];
}

export class ManualExamTemplateItemDto {
  @ApiProperty()
  @IsUUID()
  sectionId: string;

  @ApiProperty()
  @IsUUID()
  questionGroupId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  displayOrder?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  locked?: boolean;
}

export class AddManualExamTemplateItemsDto {
  @ApiProperty({ type: [ManualExamTemplateItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ManualExamTemplateItemDto)
  items: ManualExamTemplateItemDto[];
}

export class ReorderExamTemplateItemDto {
  @ApiProperty()
  @IsUUID()
  itemId: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  displayOrder: number;
}

export class ReorderExamTemplateItemsDto {
  @ApiProperty({ type: [ReorderExamTemplateItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReorderExamTemplateItemDto)
  items: ReorderExamTemplateItemDto[];
}

export class AutoFillExamTemplateItemsDto {
  @ApiPropertyOptional({ enum: QuestionPart, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(QuestionPart, { each: true })
  parts?: QuestionPart[];

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  replaceUnlocked?: boolean;
}
