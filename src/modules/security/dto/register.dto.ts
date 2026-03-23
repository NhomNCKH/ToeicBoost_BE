import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, MaxLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Tên hiển thị của tài khoản học viên',
    example: 'Nguyen Van A',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({
    description: 'Email đăng nhập duy nhất',
    example: 'user@gmail.com',
    maxLength: 255,
  })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    description: 'Mật khẩu của tài khoản học viên, tối thiểu 6 ký tự',
    example: '123456',
    minLength: 6,
    maxLength: 72,
  })
  @IsString()
  @Length(6, 72)
  password: string;
}
