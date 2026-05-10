import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AdminImportYoutubeShadowingDto {
  @ApiProperty({ example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
  @IsString()
  @IsNotEmpty()
  youtubeUrl!: string;

  @ApiPropertyOptional({ example: 'Nothing Gonna Change My Love For You (Lyric)' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: 'A1' })
  @IsString()
  @IsNotEmpty()
  level!: string;

  @ApiPropertyOptional({ type: [String], example: ['daily', 'toeic'] })
  @IsOptional()
  @IsArray()
  topics?: string[];
}

export class AdminListShadowingQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  level?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional({ enum: ['draft', 'published', 'archived'] })
  @IsOptional()
  @IsIn(['draft', 'published', 'archived'])
  status?: 'draft' | 'published' | 'archived';
}

export class AdminUpdateShadowingContentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  level?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  topics?: string[];

  @ApiPropertyOptional({ enum: ['draft', 'published', 'archived'] })
  @IsOptional()
  @IsIn(['draft', 'published', 'archived'])
  status?: 'draft' | 'published' | 'archived';
}

export class AdminUpsertShadowingSegmentDto {
  @ApiPropertyOptional({ description: 'Nếu có thì update, không có thì create mới' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  order!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  startSec!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  endSec!: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  textEn!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  textVi?: string | null;
}

export class AdminReplaceShadowingSegmentsDto {
  @ApiProperty({ type: [AdminUpsertShadowingSegmentDto] })
  @IsArray()
  segments!: AdminUpsertShadowingSegmentDto[];
}

export class LearnerListShadowingQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  level?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional({ enum: ['most-practiced', 'newest', 'shortest'] })
  @IsOptional()
  @IsString()
  sort?: string;
}

