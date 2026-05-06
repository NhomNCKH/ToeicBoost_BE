import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class VerifyFaceIdentityDto {
  @ApiPropertyOptional({
    description:
      'Exam template ID. Use this before an exam attempt is created.',
  })
  @IsOptional()
  @IsUUID()
  examTemplateId?: string;

  @ApiPropertyOptional({
    description: 'Exam attempt ID. Use this for in-exam checkpoints.',
  })
  @IsOptional()
  @IsUUID()
  examAttemptId?: string;

  @ApiProperty({
    description: 'Webcam capture as base64 image. Data URL format is accepted.',
  })
  @IsString()
  @MaxLength(10_000_000)
  webcamImageBase64: string;

  @ApiPropertyOptional({
    description:
      'Checkpoint label for audit logs, for example exam_start or random_check.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  checkpoint?: string;

  @ApiPropertyOptional({
    description: 'Optional saved webcam snapshot URL for violation review.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10_000_000)
  webcamSnapshotUrl?: string;
}
