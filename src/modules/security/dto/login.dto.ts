import { IsEmail, IsString, Length, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Email đăng nhập',
    example: 'user@gmail.com',
    maxLength: 255,
  })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    description: 'Mật khẩu tài khoản',
    example: '123456',
    minLength: 6,
    maxLength: 72,
  })
  @IsString()
  @Length(6, 72)
  password: string;
}
