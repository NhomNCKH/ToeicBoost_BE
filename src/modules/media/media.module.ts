import { Module } from '@nestjs/common';
import { S3StorageModule } from '../s3/s3-storage.module';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';

@Module({
  imports: [S3StorageModule],
  controllers: [MediaController],
  providers: [MediaService],
})
export class MediaModule {}
