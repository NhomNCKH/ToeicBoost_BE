import { ApiProperty } from '@nestjs/swagger';

export class RegisterDataDto {
  @ApiProperty({ example: '189277ea-3847-4c17-9b96-f820864b1818' })
  user_id: string;
}

export class RegisterSuccessDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Account created successfully' })
  message: string;

  @ApiProperty({ type: RegisterDataDto })
  data: RegisterDataDto;
}

export class AuthUserDto {
  @ApiProperty({ example: '77abd19e-bebe-4b90-bba4-edd4f300c17f' })
  id: string;

  @ApiProperty({ example: 'Nguyen Van A' })
  name: string;

  @ApiProperty({ example: 'user@gmail.com' })
  email: string;

  @ApiProperty({ example: 'learner' })
  role: string;

  @ApiProperty({ example: 'pending_verification' })
  status: string;
}

export class LoginDataDto {
  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken: string;

  @ApiProperty({
    example: 900,
    description: 'Thời gian hết hạn access token (giây)',
  })
  expiresIn: number;
}

export class LoginSuccessDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Login successful' })
  message: string;

  @ApiProperty({ type: LoginDataDto })
  data: LoginDataDto;
}

export class RefreshSuccessDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Token refreshed successfully' })
  message: string;

  @ApiProperty({
    description: 'Token mới (không bao gồm thông tin user)',
    example: {
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      expiresIn: 900,
    },
  })
  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export class LogoutSuccessDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Logout successful' })
  message: string;
}

export class MeSuccessDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Current user profile' })
  message: string;

  @ApiProperty({
    example: {
      sub: '77abd19e-bebe-4b90-bba4-edd4f300c17f',
      email: 'user@gmail.com',
      role: 'learner',
      iat: 1773769909,
      exp: 1773770809,
    },
  })
  data: Record<string, unknown>;
}

export class AuthErrorDto {
  @ApiProperty({ example: 409 })
  statusCode: number;

  @ApiProperty({ example: 'ConflictException' })
  error: string;

  @ApiProperty({ example: 'Email already registered' })
  message: string | string[];

  @ApiProperty({ example: '2026-03-17T17:50:59.037Z' })
  timestamp: string;

  @ApiProperty({ example: '/api_v1/auth/register' })
  path: string;
}
