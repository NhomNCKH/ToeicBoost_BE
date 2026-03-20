import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { extname } from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { S3StorageService } from '../s3/s3-storage.service';

@Injectable()
export class MediaService {
  constructor(private readonly s3StorageService: S3StorageService) {}

  async presignPutImage(
    userId: string,
    category: string,
    contentType: string,
    fileName?: string,
    expiresInSeconds?: number,
  ) {
    if (!contentType?.startsWith('image/')) {
      throw new BadRequestException('Invalid contentType. Expect image/*');
    }

    const safeCategory = this.sanitizeCategory(category || 'image');
    const extension =
      this.getExtensionFromMime(contentType) ?? extname(fileName ?? '').trim();

    if (!extension) {
      throw new BadRequestException(
        'Cannot determine file extension from contentType/fileName',
      );
    }

    const safeExt = extension.startsWith('.')
      ? extension.toLowerCase()
      : `.${extension.toLowerCase()}`;

    const objectKey =
      safeCategory === 'avatar'
        ? `avatars/${userId}/${uuidv4()}${safeExt}`
        : `media/${safeCategory}/${userId}/${uuidv4()}${safeExt}`;

    const { signedPutUrl, objectUrl } =
      await this.s3StorageService.getSignedPutUrl({
        objectKey,
        contentType,
        expiresInSeconds,
      });

    return {
      signedPutUrl,
      url: objectUrl,
      s3Key: objectKey,
      contentType,
    };
  }

  async presignGetImage(s3Key: string, expiresInSeconds?: number) {
    return this.s3StorageService.getSignedGetUrl({
      objectKey: s3Key,
      expiresInSeconds,
    });
  }

  private sanitizeCategory(category: string): string {
    // Chỉ cho phép ký tự URL/path an toàn
    return (category || 'image')
      .trim()
      .toLowerCase()
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 100);
  }

  private getExtensionFromMime(mime: string): string | null {
    const normalized = mime.toLowerCase();
    if (normalized === 'image/jpeg') return '.jpg';
    if (normalized === 'image/png') return '.png';
    if (normalized === 'image/gif') return '.gif';
    if (normalized === 'image/webp') return '.webp';
    if (normalized === 'image/bmp') return '.bmp';
    if (normalized === 'image/svg+xml') return '.svg';
    return null;
  }
}

