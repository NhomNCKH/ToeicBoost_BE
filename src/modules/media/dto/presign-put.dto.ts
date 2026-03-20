import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PresignPutDto {
  @ApiProperty({
    required: false,
    example: 'avatar',
    description:
      'Nhóm ảnh để backend chọn folder trên S3. Ví dụ: avatar, course_banner,...',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({
    example: 'image/jpeg',
    description: 'Content-Type của file ảnh',
  })
  @IsString()
  contentType: string;

  @ApiProperty({
    required: false,
    example: 'anh.jpg',
    description:
      'Tên file gốc (optional). Backend chủ yếu lấy đuôi dựa theo contentType.',
  })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiProperty({
    required: false,
    example: 300,
    description: 'Thời gian signed URL còn hiệu lực (giây)',
    minimum: 30,
    maximum: 3600,
  })
  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(3600)
  expiresInSeconds?: number;
}

