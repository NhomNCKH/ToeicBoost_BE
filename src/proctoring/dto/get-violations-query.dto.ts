import { IsUUID, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetViolationsQueryDto {
  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsUUID()
  @IsOptional()
  examId?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  @Min(1)
  limit: number = 50;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  @Min(0)
  offset: number = 0;
}
