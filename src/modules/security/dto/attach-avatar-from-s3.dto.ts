import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class AttachAvatarFromS3Dto {
  @ApiProperty({
    example: 'avatars/<userId>/<uuid>.jpg',
    description:
      's3Key của ảnh avatar trong bucket. Backend sẽ validate key thuộc về user hiện tại.',
  })
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  s3Key: string;
}

