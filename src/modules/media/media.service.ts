import { BadRequestException, Injectable } from '@nestjs/common';
import { extname } from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { S3StorageService } from '../s3/s3-storage.service';

@Injectable()
export class MediaService {
  constructor(private readonly s3StorageService: S3StorageService) {}

  async presignPutMedia(
    userId: string,
    category: string,
    contentType: string,
    fileName?: string,
    expiresInSeconds?: number,
  ) {
    // Hỗ trợ cả image và audio
    const isImage = contentType?.startsWith('image/');
    const isAudio = contentType?.startsWith('audio/');

    if (!isImage && !isAudio) {
      throw new BadRequestException(
        'Invalid contentType. Expect image/* or audio/*',
      );
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

  /**
   * Doc 1 object tu S3 va tra ve duoi dang base64 dataURL.
   *
   * Mac dich: cho FE co the inline anh (vd: avatar, QR chung chi) vao DOM khi
   * render html2canvas, tranh bi loi CORS/403 do bucket S3 khong public hoac
   * chua co cau hinh CORS rieng.
   *
   * Giai han: chi cho phep cac prefix duoc whitelist de tranh bi loi dung
   * endpoint nay de doc tuy y object.
   */
  async getObjectAsDataUrl(s3Key: string) {
    if (!s3Key || typeof s3Key !== 'string') {
      throw new BadRequestException('s3Key khong hop le');
    }

    const allowedPrefixes = ['avatars/', 'media/', 'certificates/'];
    const isAllowed = allowedPrefixes.some((prefix) => s3Key.startsWith(prefix));
    if (!isAllowed) {
      throw new BadRequestException('s3Key khong nam trong vung cho phep');
    }

    const { buffer, contentType } = await this.s3StorageService.getObject({
      objectKey: s3Key,
    });

    const base64 = buffer.toString('base64');
    return {
      s3Key,
      contentType,
      byteSize: buffer.byteLength,
      dataUrl: `data:${contentType};base64,${base64}`,
    };
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
    // Image
    if (normalized === 'image/jpeg') return '.jpg';
    if (normalized === 'image/png') return '.png';
    if (normalized === 'image/gif') return '.gif';
    if (normalized === 'image/webp') return '.webp';
    if (normalized === 'image/bmp') return '.bmp';
    if (normalized === 'image/svg+xml') return '.svg';
    // Audio
    if (normalized === 'audio/mpeg') return '.mp3';
    if (normalized === 'audio/wav') return '.wav';
    if (normalized === 'audio/ogg') return '.ogg';
    if (normalized === 'audio/aac') return '.m4a';
    if (normalized === 'audio/webm') return '.webm';
    return null;
  }
}
