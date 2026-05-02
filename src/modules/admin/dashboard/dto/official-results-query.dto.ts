import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { PaginationQueryDto } from '@common/dto/pagination-query.dto';
import { ExamAttemptStatus } from '@common/constants/assessment.enum';

export class OfficialResultsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Tu khoa tim theo ten hoc vien, email hoac ten de thi',
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ enum: ExamAttemptStatus })
  @IsOptional()
  @IsEnum(ExamAttemptStatus)
  status?: ExamAttemptStatus;

  @ApiPropertyOptional({
    description: 'Chi lay hoc vien du dieu kien cap chung chi',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  eligibleOnly?: boolean = false;

  @ApiPropertyOptional({
    description: 'Nguong diem de xac dinh du dieu kien',
    default: 500,
    minimum: 0,
    maximum: 990,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(990)
  passScoreMin?: number = 500;
}

