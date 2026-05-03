import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CertificateRegistrationProfileDto {
  @ApiProperty({ required: false, description: 'Ho va ten dung tren chung chi' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string;

  @ApiProperty({ required: false, description: 'So dinh danh/CMND/CCCD' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  identityNumber?: string;

  @ApiProperty({ required: false, description: 'Ngay sinh (yyyy-mm-dd)' })
  @IsOptional()
  @IsDateString()
  birthday?: string;

  @ApiProperty({ required: false, description: 'So dien thoai' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiProperty({ required: false, description: 'Dia chi lien he' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiProperty({ required: false, description: 'URL anh dai dien da upload S3' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  avatarUrl?: string;

  @ApiProperty({ required: false, description: 'S3 key cua anh dai dien' })
  @IsOptional()
  @IsString()
  @MaxLength(600)
  avatarS3Key?: string;
}

export class RegisterOfficialExamDto {
  @ApiProperty({ description: 'ID exam template (official_exam)' })
  @IsUUID()
  examTemplateId: string;

  @ApiProperty({
    required: false,
    description:
      'Thong tin bo sung de xuat chung chi (snapshot theo lan dang ky)',
    type: CertificateRegistrationProfileDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CertificateRegistrationProfileDto)
  profile?: CertificateRegistrationProfileDto;
}

