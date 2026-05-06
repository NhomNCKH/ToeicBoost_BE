import {
  IsDateString,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class LogProctoringEventDto {
  @IsUUID()
  @IsOptional()
  examId?: string;

  @IsUUID()
  @IsOptional()
  examAttemptId?: string;

  @IsString()
  @MaxLength(40)
  source: string;

  @IsString()
  @MaxLength(80)
  event: string;

  @IsIn(['debug', 'info', 'warn', 'error'])
  @IsOptional()
  level?: 'debug' | 'info' | 'warn' | 'error';

  @IsString()
  @IsOptional()
  @MaxLength(500)
  message?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsDateString()
  @IsOptional()
  timestamp?: string;
}
