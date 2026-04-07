import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '@common/dto/pagination-query.dto';
import { TemplateMode } from '@common/constants/exam-template.enum';
import { ExamAttemptStatus } from '@common/constants/assessment.enum';

export class LearnerExamTemplateQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TemplateMode })
  @IsOptional()
  @IsEnum(TemplateMode)
  mode?: TemplateMode;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;
}

export class LearnerExamAttemptHistoryQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  examTemplateId?: string;

  @ApiPropertyOptional({ enum: ExamAttemptStatus })
  @IsOptional()
  @IsEnum(ExamAttemptStatus)
  status?: ExamAttemptStatus;
}

export class StartExamAttemptDto {
  @ApiProperty({
    description: 'ID cua mau de thi da publish',
    example: '29fef88e-b4ee-4d06-aaba-db668d3d09f8',
  })
  @IsUUID()
  examTemplateId: string;

  @ApiPropertyOptional({
    description:
      'Tao mot lan thi moi, dong phien dang do neu can thay vi resume lai phien cu',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  forceNew?: boolean;

  @ApiPropertyOptional({
    description: 'Metadata bo sung khi bat dau lam bai',
    example: { device: 'web', source: 'mock-test-page' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class SaveExamAttemptAnswerItemDto {
  @ApiProperty({
    description: 'ID cua cau hoi can luu dap an',
    example: 'c99d4d7f-f53d-4d17-b0f4-b0c54e1a1d8e',
  })
  @IsUUID()
  questionId: string;

  @ApiPropertyOptional({
    description:
      'Lua chon cua learner. De null hoac bo trong de xoa dap an da luu',
    example: 'B',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  selectedOptionKey?: string | null;

  @ApiPropertyOptional({
    description: 'Thoi diem learner tra loi cau hoi',
    example: '2026-03-23T09:30:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  answeredAt?: string;

  @ApiPropertyOptional({
    description: 'Thoi gian lam cau hoi tinh theo giay',
    example: 18,
  })
  @IsOptional()
  timeSpentSec?: number | null;

  @ApiPropertyOptional({
    description: 'Payload bo sung cho dap an, phuc vu telemetry sau nay',
    example: { revisited: true },
  })
  @IsOptional()
  @IsObject()
  answerPayload?: Record<string, unknown>;
}

export class SaveExamAttemptAnswersDto {
  @ApiProperty({
    description: 'Danh sach dap an can luu',
    type: [SaveExamAttemptAnswerItemDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaveExamAttemptAnswerItemDto)
  answers: SaveExamAttemptAnswerItemDto[];
}

export class SubmitExamAttemptDto {
  @ApiPropertyOptional({
    description: 'Metadata bo sung luc nop bai',
    example: { source: 'submit-button' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
