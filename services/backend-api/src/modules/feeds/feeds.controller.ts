import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { CommandBus } from '@nestjs/cqrs';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum, IsBoolean } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ImportFeedContentCommand } from './commands/import-feed-content.command';
import { FeedParserService } from './services/feed-parser.service';
import { PrismaService } from '../../prisma/prisma.service';
import { FeedFormat, FeedSourceType, ImportJobStatus } from '@smartfeed/shared';

export class ImportFeedContentDto {
  @ApiProperty({ example: 'supplier_cuid' })
  @IsString()
  @IsNotEmpty()
  supplierId: string;

  @ApiProperty({ description: 'Raw XML or CSV feed string content' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ example: 'catalog_cuid' })
  @IsOptional()
  @IsString()
  catalogId?: string;

  @ApiPropertyOptional({ example: 'catalog.xml' })
  @IsOptional()
  @IsString()
  fileName?: string;
}

export class ImportFeedUrlDto {
  @ApiProperty({ example: 'supplier_cuid' })
  @IsString()
  @IsNotEmpty()
  supplierId: string;

  @ApiProperty({ example: 'https://supplier.com/feed.xml' })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiPropertyOptional({ example: 'catalog_cuid' })
  @IsOptional()
  @IsString()
  catalogId?: string;
}

export class ImportFeedAsyncBodyDto {
  @ApiProperty({ example: 'supplier_cuid' })
  @IsString()
  @IsNotEmpty()
  supplierId: string;

  @ApiProperty({ enum: FeedSourceType, default: FeedSourceType.URL })
  @IsEnum(FeedSourceType)
  sourceType: FeedSourceType;

  @ApiPropertyOptional({ example: 'https://supplier.com/feed.xml' })
  @IsOptional()
  @IsString()
  sourceUrl?: string;

  @ApiPropertyOptional({ description: 'Raw XML/CSV content for file uploads' })
  @IsOptional()
  @IsString()
  fileContent?: string;

  @ApiPropertyOptional({ example: 'catalog.xml' })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({ example: 'catalog_cuid' })
  @IsOptional()
  @IsString()
  catalogId?: string;

  @ApiPropertyOptional({ type: [String], description: 'Optional list of category IDs to import' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedCategoryIds?: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  autoUpdatePrices?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  autoUpdateStocks?: boolean;
}

export class AnalyzeFeedDto {
  @ApiProperty({ description: 'Raw XML or CSV feed string content to analyze' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ example: 'supplier_cuid' })
  @IsOptional()
  @IsString()
  supplierId?: string;
}

export class AnalyzeFeedUrlDto {
  @ApiProperty({ example: 'https://supplier.com/feed.xml' })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiPropertyOptional({ example: 'supplier_cuid' })
  @IsOptional()
  @IsString()
  supplierId?: string;
}

@ApiTags('Feeds Ingestion')
@Controller('feeds')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FeedsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly feedParser: FeedParserService,
    private readonly prisma: PrismaService,
    @InjectQueue('feed-import') private readonly feedImportQueue: Queue,
  ) {}

  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Analyze feed structure and auto-detect columns & categories' })
  @ApiResponse({
    status: 200,
    description: 'Feed analysis result with detected format, categories and sample products',
  })
  async analyzeFeed(@CurrentUser('id') userId: string, @Body() dto: AnalyzeFeedDto) {
    if (!dto.content || !dto.content.trim()) {
      throw new BadRequestException('Feed content cannot be empty');
    }

    let markup: { defaultMarginPercent?: number; defaultFixedMarkup?: number } = {};
    if (dto.supplierId) {
      const supplier = await this.prisma.supplier.findFirst({
        where: { id: dto.supplierId, userId },
      });
      if (supplier) {
        markup = {
          defaultMarginPercent: Number(supplier.defaultMarginPercent),
          defaultFixedMarkup: Number(supplier.defaultFixedMarkup),
        };
      }
    }

    const result = this.feedParser.parseFeedContent(dto.content, markup);
    return {
      format: result.format,
      totalDetected: result.products.length,
      categoriesCount: result.categories.length,
      categories: result.categories,
      sampleCategories: result.categories.slice(0, 10),
      sampleProducts: result.products.slice(0, 5),
    };
  }

  @Post('analyze-url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fetch remote feed by URL and analyze its structure' })
  @ApiResponse({
    status: 200,
    description: 'URL feed analysis result with detected format, categories and sample products',
  })
  async analyzeFeedUrl(@CurrentUser('id') userId: string, @Body() dto: AnalyzeFeedUrlDto) {
    if (!dto.url || !dto.url.trim()) {
      throw new BadRequestException('URL посилання на фід не може бути порожнім');
    }

    const content = await this.feedParser.fetchFeedFromUrl(dto.url);

    let markup: { defaultMarginPercent?: number; defaultFixedMarkup?: number } = {};
    if (dto.supplierId) {
      const supplier = await this.prisma.supplier.findFirst({
        where: { id: dto.supplierId, userId },
      });
      if (supplier) {
        markup = {
          defaultMarginPercent: Number(supplier.defaultMarginPercent),
          defaultFixedMarkup: Number(supplier.defaultFixedMarkup),
        };
      }
    }

    const result = this.feedParser.parseFeedContent(content, markup);
    return {
      url: dto.url,
      format: result.format,
      totalDetected: result.products.length,
      categoriesCount: result.categories.length,
      categories: result.categories,
      sampleCategories: result.categories.slice(0, 10),
      sampleProducts: result.products.slice(0, 5),
    };
  }

  @Post('import-async')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Queue non-blocking background feed ingestion job with category filtering',
  })
  @ApiResponse({
    status: 202,
    description: 'Background job queued successfully with jobId and initial status',
  })
  async importAsync(@CurrentUser('id') userId: string, @Body() dto: ImportFeedAsyncBodyDto) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: dto.supplierId, userId },
    });
    if (!supplier) {
      throw new NotFoundException('Постачальника не знайдено');
    }

    if (dto.sourceType === FeedSourceType.URL && (!dto.sourceUrl || !dto.sourceUrl.trim())) {
      throw new BadRequestException('URL посилання є обовʼязковим для типу джерела URL');
    }
    if (dto.sourceType === FeedSourceType.FILE && (!dto.fileContent || !dto.fileContent.trim())) {
      throw new BadRequestException('Вміст файлу є обовʼязковим для типу джерела FILE');
    }

    // 1. Find or create FeedSource record
    let feedSource = await this.prisma.feedSource.findFirst({
      where: {
        supplierId: supplier.id,
        sourceType: dto.sourceType,
        sourceUrl: dto.sourceUrl || undefined,
      },
    });

    if (!feedSource) {
      const feedName =
        dto.sourceType === FeedSourceType.URL
          ? dto.sourceUrl?.split('?')[0].split('/').pop() || 'URL Feed'
          : dto.fileName || 'Uploaded Feed File';

      feedSource = await this.prisma.feedSource.create({
        data: {
          supplierId: supplier.id,
          name: feedName,
          sourceType: dto.sourceType,
          fileFormat: FeedFormat.XML_ROZETKA,
          sourceUrl: dto.sourceUrl,
          autoUpdatePrices: dto.autoUpdatePrices ?? true,
          autoUpdateStocks: dto.autoUpdateStocks ?? true,
          lastSyncStatus: 'QUEUED',
        },
      });
    }

    // 2. Create ImportJob record in DB
    const importJob = await this.prisma.importJob.create({
      data: {
        feedSourceId: feedSource.id,
        userId,
        status: ImportJobStatus.PENDING,
        selectedCategories: dto.selectedCategoryIds || [],
      },
    });

    // 3. Dispatch to BullMQ Queue
    await this.feedImportQueue.add(
      'import-job',
      {
        importJobId: importJob.id,
        userId,
        supplierId: supplier.id,
        feedSourceId: feedSource.id,
        content: dto.fileContent,
        url: dto.sourceUrl,
        selectedCategoryIds: dto.selectedCategoryIds,
        catalogId: dto.catalogId,
        autoUpdatePrices: dto.autoUpdatePrices ?? true,
        autoUpdateStocks: dto.autoUpdateStocks ?? true,
      },
      {
        jobId: importJob.id,
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    return {
      success: true,
      jobId: importJob.id,
      feedSourceId: feedSource.id,
      status: ImportJobStatus.PENDING,
    };
  }

  @Get('jobs/:jobId')
  @ApiOperation({ summary: 'Get current status and progress of a background feed import job' })
  async getJobStatus(@CurrentUser('id') userId: string, @Param('jobId') jobId: string) {
    const job = await this.prisma.importJob.findFirst({
      where: { id: jobId, userId },
      include: {
        feedSource: {
          select: {
            name: true,
            sourceType: true,
            sourceUrl: true,
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Задачу імпорту не знайдено');
    }

    const progressPercent =
      job.totalItems > 0
        ? Math.min(100, Math.round((job.processedItems / job.totalItems) * 100))
        : job.status === ImportJobStatus.COMPLETED
          ? 100
          : 0;

    return {
      ...job,
      progressPercent,
    };
  }

  @Get('jobs/active')
  @ApiOperation({ summary: 'Get all active running import jobs for current user' })
  async getActiveJobs(@CurrentUser('id') userId: string) {
    const jobs = await this.prisma.importJob.findMany({
      where: {
        userId,
        status: {
          in: [
            ImportJobStatus.PENDING,
            ImportJobStatus.DOWNLOADING,
            ImportJobStatus.PARSING,
            ImportJobStatus.MAPPING,
            ImportJobStatus.SAVING,
          ],
        },
      },
      include: {
        feedSource: {
          select: {
            name: true,
            sourceType: true,
            sourceUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return jobs.map((job) => ({
      ...job,
      progressPercent:
        job.totalItems > 0
          ? Math.min(100, Math.round((job.processedItems / job.totalItems) * 100))
          : 0,
    }));
  }

  @Get('suppliers/:supplierId/sources')
  @ApiOperation({ summary: 'Get list of all connected feed sources for a supplier' })
  async getSupplierFeedSources(
    @CurrentUser('id') userId: string,
    @Param('supplierId') supplierId: string,
  ) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, userId },
    });
    if (!supplier) {
      throw new NotFoundException('Постачальника не знайдено');
    }

    const sources = await this.prisma.feedSource.findMany({
      where: { supplierId: supplier.id },
      include: {
        _count: {
          select: {
            importJobs: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Count products linked to this supplier
    const productsCount = await this.prisma.product.count({
      where: { supplierId: supplier.id },
    });

    return sources.map((s) => ({
      ...s,
      productsCount,
    }));
  }

  @Post('suppliers/:supplierId/sources/:sourceId/sync')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Trigger background re-sync of a connected feed source' })
  async syncFeedSource(
    @CurrentUser('id') userId: string,
    @Param('supplierId') supplierId: string,
    @Param('sourceId') sourceId: string,
  ) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, userId },
    });
    if (!supplier) {
      throw new NotFoundException('Постачальника не знайдено');
    }

    const feedSource = await this.prisma.feedSource.findFirst({
      where: { id: sourceId, supplierId: supplier.id },
    });
    if (!feedSource) {
      throw new NotFoundException('Джерело фіду не знайдено');
    }

    if (feedSource.sourceType === FeedSourceType.FILE || !feedSource.sourceUrl) {
      throw new BadRequestException(
        'Файлові фіди не підтримують повторну синхронізацію за URL. Будь ласка, завантажте оновлений файл каталогу.',
      );
    }

    // Create ImportJob
    const importJob = await this.prisma.importJob.create({
      data: {
        feedSourceId: feedSource.id,
        userId,
        status: ImportJobStatus.PENDING,
      },
    });

    // Dispatch to BullMQ
    await this.feedImportQueue.add(
      'import-job',
      {
        importJobId: importJob.id,
        userId,
        supplierId: supplier.id,
        feedSourceId: feedSource.id,
        url: feedSource.sourceUrl || undefined,
        autoUpdatePrices: feedSource.autoUpdatePrices,
        autoUpdateStocks: feedSource.autoUpdateStocks,
      },
      {
        jobId: importJob.id,
        removeOnComplete: true,
      },
    );

    return {
      success: true,
      jobId: importJob.id,
      feedSourceId: feedSource.id,
      status: ImportJobStatus.PENDING,
    };
  }

  @Delete('suppliers/:supplierId/sources/:sourceId')
  @ApiOperation({ summary: 'Delete connected feed source with optional product cascade' })
  async deleteFeedSource(
    @CurrentUser('id') userId: string,
    @Param('supplierId') supplierId: string,
    @Param('sourceId') sourceId: string,
    @Query('deleteProducts') deleteProducts?: string,
  ) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, userId },
    });
    if (!supplier) {
      throw new NotFoundException('Постачальника не знайдено');
    }

    const feedSource = await this.prisma.feedSource.findFirst({
      where: { id: sourceId, supplierId: supplier.id },
    });
    if (!feedSource) {
      throw new NotFoundException('Джерело фіду не знайдено');
    }

    let deletedProductsCount = 0;
    if (deleteProducts === 'true' || deleteProducts === '1') {
      const deleteResult = await this.prisma.product.deleteMany({
        where: { feedSourceId: feedSource.id },
      });
      deletedProductsCount = deleteResult.count;
    }

    await this.prisma.feedSource.delete({
      where: { id: feedSource.id },
    });

    return {
      success: true,
      message: 'Джерело фіду успішно видалено',
      deletedProductsCount,
    };
  }

  @Post('import-content')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Import products from raw XML/CSV content linked to a supplier' })
  @ApiResponse({ status: 200, description: 'Import summary with count of created/updated items' })
  async importContent(@CurrentUser('id') userId: string, @Body() dto: ImportFeedContentDto) {
    return this.commandBus.execute(
      new ImportFeedContentCommand(
        userId,
        dto.supplierId,
        dto.content,
        dto.catalogId,
        FeedSourceType.FILE,
        undefined,
        dto.fileName,
      ),
    );
  }

  @Post('import-url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fetch remote feed by URL and import products into catalog' })
  @ApiResponse({ status: 200, description: 'Import summary with count of created/updated items' })
  async importUrl(@CurrentUser('id') userId: string, @Body() dto: ImportFeedUrlDto) {
    if (!dto.url || !dto.url.trim()) {
      throw new BadRequestException('URL посилання на фід не може бути порожнім');
    }

    const content = await this.feedParser.fetchFeedFromUrl(dto.url);

    return this.commandBus.execute(
      new ImportFeedContentCommand(
        userId,
        dto.supplierId,
        content,
        dto.catalogId,
        FeedSourceType.URL,
        dto.url,
      ),
    );
  }
}
