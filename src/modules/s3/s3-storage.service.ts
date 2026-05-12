import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3StorageService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.getOrThrow<string>('AWS_BUCKET_NAME');
    this.region = this.configService.getOrThrow<string>('AWS_REGION');

    // Dùng credential tĩnh từ `.env` để đảm bảo deploy đơn giản.
    const accessKeyId = this.configService.getOrThrow<string>('AWS_ACCESS_KEY');
    const secretAccessKey =
      this.configService.getOrThrow<string>('AWS_SECRET_KEY');

    this.s3Client = new S3Client({
      region: this.region,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  getBucketName(): string {
    return this.bucketName;
  }

  getRegion(): string {
    return this.region;
  }

  buildPublicUrl(objectKey: string): string {
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${objectKey}`;
  }

  async uploadObject(params: {
    objectKey: string;
    body: Buffer;
    contentType: string;
  }): Promise<{ objectUrl: string }> {
    const { objectKey, body, contentType } = params;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
        Body: body,
        ContentType: contentType,
      }),
    );

    return { objectUrl: this.buildPublicUrl(objectKey) };
  }

  async getObjectBuffer(params: { objectKey: string }): Promise<Buffer> {
    const { buffer } = await this.getObject(params);
    return buffer;
  }

  /**
   * Doc object tu S3 va tra ve ca buffer + contentType.
   * Dung cho cac flow proxy media qua BE de tranh CORS tu S3 (vd: nhung anh
   * QR/avatar can de FE chup bang html2canvas).
   */
  async getObject(params: {
    objectKey: string;
  }): Promise<{ buffer: Buffer; contentType: string }> {
    const response = await this.s3Client.send(
      new GetObjectCommand({
        Bucket: this.bucketName,
        Key: params.objectKey,
      }),
    );

    const contentType = response.ContentType ?? 'application/octet-stream';

    if (!response.Body) {
      return { buffer: Buffer.alloc(0), contentType };
    }

    const body = response.Body as unknown;
    const transformable = body as {
      transformToByteArray?: () => Promise<Uint8Array>;
    };

    if (typeof transformable.transformToByteArray === 'function') {
      const buffer = Buffer.from(await transformable.transformToByteArray());
      return { buffer, contentType };
    }

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const stream = body as NodeJS.ReadableStream;

      stream.on('data', (chunk: Buffer | string) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });
      stream.on('error', reject);
      stream.on('end', () =>
        resolve({ buffer: Buffer.concat(chunks), contentType }),
      );
    });
  }

  async getSignedPutUrl(params: {
    objectKey: string;
    contentType: string;
    expiresInSeconds?: number;
  }): Promise<{ signedPutUrl: string; objectUrl: string }> {
    const { objectKey, contentType, expiresInSeconds = 300 } = params;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
      ContentType: contentType,
    });

    const signedPutUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: expiresInSeconds,
    });

    return {
      signedPutUrl,
      objectUrl: this.buildPublicUrl(objectKey),
    };
  }

  async getSignedGetUrl(params: {
    objectKey: string;
    expiresInSeconds?: number;
  }): Promise<{ signedGetUrl: string; objectUrl: string }> {
    const { objectKey, expiresInSeconds = 3600 } = params;

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
    });

    const signedGetUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: expiresInSeconds,
    });

    return {
      signedGetUrl,
      objectUrl: this.buildPublicUrl(objectKey),
    };
  }
}
