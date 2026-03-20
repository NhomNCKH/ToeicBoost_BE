import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
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

