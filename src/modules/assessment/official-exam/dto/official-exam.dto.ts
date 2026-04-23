import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class RegisterOfficialExamDto {
  @ApiProperty({ description: 'ID exam template (official_exam)' })
  @IsUUID()
  examTemplateId: string;
}

