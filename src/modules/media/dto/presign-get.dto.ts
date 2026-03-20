import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PresignGetDto {
  @ApiProperty({
    example: 'avatars/<userId>/<uuid>.jpg',
    description: 's3Key của object cần xem',
  })
  @IsString()
  s3Key: string;

  @ApiProperty({
    required: false,
    example: 3600,
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

