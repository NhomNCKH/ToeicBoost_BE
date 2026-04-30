import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ViolationDetailDto {
  @IsString()
  action: string;

  @IsString()
  @IsOptional()
  message?: string;

  @IsNumber()
  @IsOptional()
  severity?: number;

  @IsNumber()
  @IsOptional()
  confidence?: number;

  @IsDateString()
  @IsOptional()
  timestamp?: string;

  @IsString()
  @IsOptional()
  snapshotImage?: string;

  @IsString()
  @IsOptional()
  screenshotUrl?: string;
}

export class ReportViolationDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  @IsOptional()
  examId?: string;

  @IsUUID()
  @IsOptional()
  examAttemptId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ViolationDetailDto)
  violations: ViolationDetailDto[];

  @IsDateString()
  @IsOptional()
  timestamp?: string;
}
