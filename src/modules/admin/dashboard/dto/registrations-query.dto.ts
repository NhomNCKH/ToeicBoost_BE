import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '@common/dto/pagination-query.dto';
import { OfficialExamRegistrationStatus } from '@modules/assessment/official-exam/entities/official-exam-registration.entity';

export class RegistrationsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Tu khoa tim theo ten hoc vien, email hoac ten/ma de thi',
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ enum: OfficialExamRegistrationStatus })
  @IsOptional()
  @IsEnum(OfficialExamRegistrationStatus)
  status?: OfficialExamRegistrationStatus;

  @ApiPropertyOptional({ description: 'Loc theo ID de thi chinh thuc' })
  @IsOptional()
  @IsUUID()
  examTemplateId?: string;
}
