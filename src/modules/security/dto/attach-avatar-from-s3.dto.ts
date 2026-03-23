import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class AttachAvatarFromS3Dto {
  @ApiProperty({
    example: 'avatars/<userId>/<uuid>.jpg',
    description:
      'S3 key của ảnh avatar trong bucket. Backend sẽ kiểm tra key này có thuộc về người dùng hiện tại hay không.',
  })
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  s3Key: string;
}
