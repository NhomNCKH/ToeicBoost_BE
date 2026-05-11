import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { TimiPersona } from '../entities/timi-session.entity';

export class CreateTimiSessionDto {
  @ApiPropertyOptional({ enum: TimiPersona, default: TimiPersona.CASUAL })
  @IsOptional()
  @IsEnum(TimiPersona)
  persona?: TimiPersona;

  @ApiPropertyOptional({ description: 'Tên gợi nhớ phiên (tuỳ chọn)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;
}

export class TimiTextTurnDto {
  @ApiProperty({ description: 'Tin nhắn dạng text từ học viên' })
  @IsString()
  @MaxLength(2000)
  text: string;
}
