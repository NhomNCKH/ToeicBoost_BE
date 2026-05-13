import { Injectable, Logger } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { S3StorageService } from '@modules/s3/s3-storage.service';

export interface GenerateQrImageInput {
  credentialId: string;
  qrToken: string;
  verifyUrl: string;
}

export interface GenerateQrImageResult {
  s3Key: string;
  publicUrl: string;
  contentType: string;
  byteSize: number;
}

/**
 * Sinh ảnh QR (PNG) cho chứng chỉ và upload lên S3.
 *
 * QR encode chính `verifyUrl` (URL public verify của FE) để khi học viên/đối tác
 * quét bằng app camera mặc định sẽ mở thẳng được trang verify trên trình duyệt.
 */
@Injectable()
export class CredentialAssetService {
  private readonly logger = new Logger(CredentialAssetService.name);

  constructor(private readonly s3StorageService: S3StorageService) {}

  async generateAndUploadQrImage(
    input: GenerateQrImageInput,
  ): Promise<GenerateQrImageResult> {
    const { credentialId, qrToken, verifyUrl } = input;

    const buffer = await QRCode.toBuffer(verifyUrl, {
      errorCorrectionLevel: 'H',
      type: 'png',
      margin: 1,
      width: 512,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    const s3Key = `certificates/qr/${credentialId}-${qrToken.slice(0, 8)}.png`;
    const contentType = 'image/png';

    const { objectUrl } = await this.s3StorageService.uploadObject({
      objectKey: s3Key,
      body: buffer,
      contentType,
    });

    this.logger.log(
      `Uploaded QR image for credential ${credentialId} to S3 key ${s3Key} (${buffer.byteLength} bytes)`,
    );

    return {
      s3Key,
      publicUrl: objectUrl,
      contentType,
      byteSize: buffer.byteLength,
    };
  }
}
