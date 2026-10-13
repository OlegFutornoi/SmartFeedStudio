import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { GetStorageFilesQuery } from '@/modules/storage/queries/get-storage-files.query';
import {
  StorageFileListResponseDto,
  StorageFileCategory,
  StorageFileStatus,
  StorageFileDto,
} from '@smartfeed/shared';
import { Prisma } from '@/generated/prisma/client';

@Injectable()
@QueryHandler(GetStorageFilesQuery)
export class GetStorageFilesHandler implements IQueryHandler<
  GetStorageFilesQuery,
  StorageFileListResponseDto
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetStorageFilesQuery): Promise<StorageFileListResponseDto> {
    const { userId, queryDto } = query;
    const page = Math.max(1, queryDto.page || 1);
    const limit = Math.min(100, Math.max(1, queryDto.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.StorageFileWhereInput = {
      userId,
      status: 'ACTIVE',
    };

    if (queryDto.folder) {
      where.s3Key = {
        startsWith: `${queryDto.folder}/${userId}/`,
      };
    }

    if (queryDto.search) {
      const term = queryDto.search.trim();
      where.OR = [
        { originalName: { contains: term, mode: 'insensitive' } },
        { s3Key: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [total, files] = await Promise.all([
      this.prisma.storageFile.count({ where }),
      this.prisma.storageFile.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const items: StorageFileDto[] = files.map((file) => ({
      id: file.id,
      userId: file.userId,
      organizationId: file.organizationId,
      category: file.category as StorageFileCategory,
      status: file.status as StorageFileStatus,
      bucketName: file.bucketName,
      s3Key: file.s3Key,
      publicUrl: file.publicUrl,
      originalName: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: Number(file.sizeBytes),
      checksumSha256: file.checksumSha256,
      width: file.width,
      height: file.height,
      refCount: file.refCount,
      expiresAt: file.expiresAt?.toISOString() || null,
      createdAt: file.createdAt.toISOString(),
      updatedAt: file.updatedAt.toISOString(),
    }));

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
