import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3StorageService {
  private readonly logger = new Logger(S3StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicDomain?: string;
  private readonly endpoint: string;

  constructor(private readonly configService: ConfigService) {
    this.endpoint = this.configService.get<string>('S3_ENDPOINT') || 'http://localhost:9000';
    const region = this.configService.get<string>('S3_REGION') || 'auto';
    const accessKeyId = this.configService.get<string>('S3_ACCESS_KEY_ID') || 'minioadmin';
    const secretAccessKey =
      this.configService.get<string>('S3_SECRET_ACCESS_KEY') || 'minioadminpassword';
    this.bucketName = this.configService.get<string>('S3_BUCKET_NAME') || 'smartfeed-storage';
    this.publicDomain = this.configService.get<string>('S3_PUBLIC_DOMAIN');

    // Cloudflare R2 requires forcePathStyle: false; MinIO requires forcePathStyle: true
    const isMinio = this.endpoint.includes('localhost') || this.endpoint.includes('127.0.0.1');
    const configuredForcePathStyle = this.configService.get<string>('S3_FORCE_PATH_STYLE');
    const forcePathStyle =
      configuredForcePathStyle !== undefined ? configuredForcePathStyle === 'true' : isMinio;

    this.s3Client = new S3Client({
      endpoint: this.endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle,
    });

    this.logger.log(
      `S3StorageService initialized: endpoint=${this.endpoint}, bucket=${this.bucketName}, pathStyle=${forcePathStyle}`,
    );
  }

  getBucketName(): string {
    return this.bucketName;
  }

  getPublicUrl(s3Key: string): string {
    if (this.publicDomain) {
      return `${this.publicDomain.replace(/\/+$/, '')}/${s3Key}`;
    }
    return `${this.endpoint.replace(/\/+$/, '')}/${this.bucketName}/${s3Key}`;
  }

  async generatePresignedUploadUrl(
    s3Key: string,
    contentType: string,
    metadata: Record<string, string>,
    expiresInSeconds = 900,
  ): Promise<string> {
    const putCommand = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
      ContentType: contentType,
      Metadata: metadata,
    });

    return getSignedUrl(this.s3Client, putCommand, {
      expiresIn: expiresInSeconds,
    });
  }

  async headObject(s3Key: string): Promise<{ contentLength: number; contentType: string } | null> {
    try {
      const response = await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: s3Key,
        }),
      );
      return {
        contentLength: response.ContentLength ?? 0,
        contentType: response.ContentType ?? 'application/octet-stream',
      };
    } catch (err: unknown) {
      this.logger.warn(`HeadObject failed for key="${s3Key}": ${(err as Error).message}`);
      return null;
    }
  }

  async deleteObject(s3Key: string): Promise<boolean> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: s3Key,
        }),
      );
      this.logger.log(`Deleted S3 object: key="${s3Key}" from bucket="${this.bucketName}"`);
      return true;
    } catch (err: unknown) {
      this.logger.error(`DeleteObject failed for key="${s3Key}": ${(err as Error).message}`);
      return false;
    }
  }
}
