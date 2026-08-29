import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PresignedUploadUrlResult } from '@smartfeed/shared';
import * as crypto from 'crypto';
import { GeneratePresignedUploadUrlCommand } from './generate-presigned-url.command';

@Injectable()
@CommandHandler(GeneratePresignedUploadUrlCommand)
export class GeneratePresignedUploadUrlHandler implements ICommandHandler<
  GeneratePresignedUploadUrlCommand,
  PresignedUploadUrlResult
> {
  private readonly logger = new Logger(GeneratePresignedUploadUrlHandler.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('S3_ENDPOINT') || 'http://localhost:9000';
    const region = this.configService.get<string>('S3_REGION') || 'us-east-1';
    const accessKeyId = this.configService.get<string>('S3_ACCESS_KEY_ID') || 'minioadmin';
    const secretAccessKey =
      this.configService.get<string>('S3_SECRET_ACCESS_KEY') || 'minioadminpassword';
    this.bucketName = this.configService.get<string>('S3_BUCKET_NAME') || 'smartfeed-storage';
    const forcePathStyle = this.configService.get<string>('S3_FORCE_PATH_STYLE', 'true') === 'true';

    this.s3Client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle,
    });
  }

  async execute(command: GeneratePresignedUploadUrlCommand): Promise<PresignedUploadUrlResult> {
    const { userId, fileName, contentType, folder } = command;

    const ALLOWED_FOLDERS = new Set(['images', 'snapshots', 'catalogs', 'exports']);
    const targetFolder =
      folder && ALLOWED_FOLDERS.has(folder.toLowerCase().trim())
        ? folder.toLowerCase().trim()
        : 'images';

    const ALLOWED_MIME_TYPES = new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/xml',
      'text/xml',
      'text/csv',
      'application/json',
      'application/zip',
      'application/octet-stream',
    ]);

    const normalizedContentType = (contentType || '').toLowerCase().trim();
    if (!ALLOWED_MIME_TYPES.has(normalizedContentType)) {
      throw new BadRequestException(
        `Unsupported or unsafe Content-Type: "${contentType}". Allowed types: JPEG, PNG, WEBP, GIF, XML, CSV, JSON, ZIP.`,
      );
    }

    // Path traversal defense: strip any path separators and keep only safe basename
    const baseFileName = fileName.split(/[/\\]/).pop() || 'upload';
    const sanitizedFileName = baseFileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
    const uniqueSuffix = crypto.randomBytes(4).toString('hex');
    const s3Key = `${targetFolder}/${userId}/${Date.now()}-${uniqueSuffix}-${sanitizedFileName}`;

    const expiresInSeconds = 60 * 15; // 15 minutes validity

    const putCommand = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
      ContentType: contentType,
      Metadata: {
        userId,
        uploadedAt: new Date().toISOString(),
      },
    });

    const uploadUrl = await getSignedUrl(this.s3Client, putCommand, {
      expiresIn: expiresInSeconds,
    });

    const publicUrl = `${this.configService.get<string>('S3_ENDPOINT') || 'http://localhost:9000'}/${this.bucketName}/${s3Key}`;

    this.logger.log(
      `Generated presigned upload URL for user=${userId}, key=${s3Key}, contentType=${contentType}`,
    );

    return {
      uploadUrl,
      s3Key,
      publicUrl,
      expiresInSeconds,
    };
  }
}
