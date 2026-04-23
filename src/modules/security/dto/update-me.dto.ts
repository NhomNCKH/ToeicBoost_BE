import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateMeDto {
  @ApiPropertyOptional({ example: 'Nguyễn Văn A' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: '0987654321' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ example: '2000-01-31', description: 'ISO date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  birthday?: string;

  @ApiPropertyOptional({ example: 'Hà Nội' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({ example: 'Mục tiêu 800+ TOEIC trong 3 tháng' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @ApiPropertyOptional({ example: 'https://linkedin.com/in/your-handle' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  linkedin?: string;

  @ApiPropertyOptional({ example: 'https://github.com/your-handle' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  github?: string;

  @ApiPropertyOptional({ example: 'https://twitter.com/your-handle' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  twitter?: string;
}

