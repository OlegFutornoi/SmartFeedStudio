import {
  BadRequestException,
  NotFoundException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  type FetchFeedResultDto,
  type FeedSourceDto,
  type ImportJobDto,
  type FeedCollisionResultDto,
  ImportJobStatus,
} from '@smartfeed/shared';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import {
  FetchFeedUrlDto,
  ImportFeedAsyncDto,
  CheckFeedCollisionDto,
  CreateSupplierFeedSourceDto,
  UpdateSupplierFeedSourceDto,
} from '@/modules/feeds/dto';
import { FetchFeedUrlQuery } from '@/modules/feeds/queries/fetch-feed-url.query';
import { CheckFeedCollisionQuery } from '@/modules/feeds/queries/check-feed-collision.query';
import { GetSupplierFeedSourcesQuery } from '@/modules/feeds/queries/get-supplier-feed-sources.query';
import { GetAllFeedSourcesQuery } from '@/modules/feeds/queries/get-all-feed-sources.query';
import { UpsertSupplierFeedSourceCommand } from '@/modules/feeds/commands/upsert-supplier-feed-source.command';
import { UpdateSupplierFeedSourceCommand } from '@/modules/feeds/commands/update-supplier-feed-source.command';
import { DeleteSupplierFeedSourceCommand } from '@/modules/feeds/commands/delete-supplier-feed-source.command';
import { GetSupplierByIdQuery } from '@/modules/suppliers/queries/suppliers.queries';

@ApiTags('Feeds')
@Controller('feeds')
export class FeedsController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    @InjectQueue('feed-ingestion') private readonly feedQueue: Queue,
  ) {}

  @Post('fetch-url')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Relay and download XML/CSV feed content by URL bypassing browser CORS restrictions',
  })
  @ApiResponse({ status: 200, description: 'Feed content downloaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid URL or SSRF protection triggered' })
  @ApiResponse({ status: 404, description: 'Remote feed URL not found' })
  @ApiResponse({ status: 504, description: 'Supplier server timed out' })
  async fetchFeedUrl(@Body() dto: FetchFeedUrlDto): Promise<FetchFeedResultDto> {
    return this.queryBus.execute(new FetchFeedUrlQuery(dto.url));
  }

  @Post('check-collision')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Check feed URL or content for duplicates and multi-supplier collisions',
  })
  @ApiResponse({ status: 200, description: 'Feed collision check result' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  async checkCollision(
    @Body() dto: CheckFeedCollisionDto,
    @CurrentUser() user: { id: string },
  ): Promise<FeedCollisionResultDto> {
    return this.queryBus.execute(new CheckFeedCollisionQuery(dto, user.id));
  }

  @Get('sources')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all cloud feed sources' })
  @ApiResponse({ status: 200, description: 'List of feed sources' })
  async getAllSources(@CurrentUser() user: { id: string }): Promise<FeedSourceDto[]> {
    return this.queryBus.execute(new GetAllFeedSourcesQuery(user.id));
  }

  @Get('suppliers/:supplierId/sources')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get feed sources for a specific supplier' })
  @ApiResponse({ status: 200, description: 'List of supplier feed sources' })
  async getSupplierSources(
    @Param('supplierId') supplierId: string,
    @CurrentUser() user: { id: string },
  ): Promise<FeedSourceDto[]> {
    return this.queryBus.execute(new GetSupplierFeedSourcesQuery(supplierId, user.id));
  }

  @Post('suppliers/:supplierId/sources')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create or upsert supplier feed source' })
  @ApiResponse({ status: 201, description: 'Feed source created or updated' })
  async createSupplierSource(
    @Param('supplierId') supplierId: string,
    @Body() dto: CreateSupplierFeedSourceDto,
    @CurrentUser() user: { id: string },
  ): Promise<FeedSourceDto> {
    return this.commandBus.execute(new UpsertSupplierFeedSourceCommand(supplierId, user.id, dto));
  }

  @Patch('suppliers/:supplierId/sources/:sourceId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update supplier feed source' })
  @ApiResponse({ status: 200, description: 'Feed source updated' })
  async updateSupplierSource(
    @Param('supplierId') supplierId: string,
    @Param('sourceId') sourceId: string,
    @Body() dto: UpdateSupplierFeedSourceDto,
    @CurrentUser() user: { id: string },
  ): Promise<FeedSourceDto> {
    return this.commandBus.execute(
      new UpdateSupplierFeedSourceCommand(supplierId, sourceId, user.id, dto),
    );
  }

  @Delete('suppliers/:supplierId/sources/:sourceId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete supplier feed source' })
  @ApiResponse({ status: 200, description: 'Feed source deleted' })
  async deleteSupplierSource(
    @Param('supplierId') supplierId: string,
    @Param('sourceId') sourceId: string,
    @CurrentUser() user: { id: string },
  ): Promise<{ success: boolean; id: string }> {
    return this.commandBus.execute(
      new DeleteSupplierFeedSourceCommand(supplierId, sourceId, user.id),
    );
  }

  @Get('jobs/active')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get active background feed processing jobs' })
  @ApiResponse({ status: 200, description: 'List of active feed jobs' })
  async getActiveJobs(): Promise<ImportJobDto[]> {
    const [activeJobs, waitingJobs] = await Promise.all([
      this.feedQueue.getJobs(['active']),
      this.feedQueue.getJobs(['waiting', 'delayed']),
    ]);
    const activeIds = new Set(activeJobs.map((j) => j.id));
    const all = [...activeJobs, ...waitingJobs];

    return all.map((job) => ({
      id: job.id!,
      feedSourceId: (job.data?.feedSourceId as string) || 'feed_source_cloud',
      status: activeIds.has(job.id) ? ImportJobStatus.PARSING : ImportJobStatus.PENDING,
      totalItems: job.data?.totalItems || 0,
      processedItems: 0,
      createdItems: 0,
      updatedItems: 0,
      failedItems: 0,
      progressPercent: typeof job.progress === 'number' ? job.progress : 0,
      createdAt: new Date(job.timestamp).toISOString(),
    }));
  }

  @Get('jobs/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get import job status by ID' })
  @ApiResponse({ status: 200, description: 'Import job details' })
  async getJobStatus(@Param('id') id: string): Promise<ImportJobDto> {
    const job = await this.feedQueue.getJob(id);
    if (!job) {
      throw new NotFoundException(`Feed ingestion job with id ${id} not found`);
    }

    const state = await job.getState();
    let status = ImportJobStatus.PENDING;
    if (state === 'active') status = ImportJobStatus.PARSING;
    else if (state === 'completed') status = ImportJobStatus.COMPLETED;
    else if (state === 'failed') status = ImportJobStatus.FAILED;

    const progress =
      typeof job.progress === 'number'
        ? job.progress
        : status === ImportJobStatus.COMPLETED
          ? 100
          : 0;

    return {
      id: job.id!,
      feedSourceId: (job.data?.feedSourceId as string) || 'feed_source_cloud',
      status,
      totalItems: job.data?.totalItems || 0,
      processedItems: status === ImportJobStatus.COMPLETED ? job.data?.totalItems || 0 : 0,
      createdItems: 0,
      updatedItems: 0,
      failedItems: 0,
      progressPercent: progress,
      createdAt: new Date(job.timestamp).toISOString(),
      completedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : undefined,
    };
  }

  @Post('import-async')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Trigger asynchronous feed import' })
  @ApiResponse({ status: 200, description: 'Import job queued successfully' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  async importAsync(
    @Body() dto: ImportFeedAsyncDto,
    @CurrentUser() user: { id: string },
  ): Promise<{ success: boolean; jobId: string; feedSourceId: string; status: string }> {
    await this.queryBus.execute(new GetSupplierByIdQuery(dto.supplierId, user.id));

    if (dto.fileContent) {
      const trimmed = dto.fileContent.trim();
      const isXml =
        trimmed.startsWith('<') &&
        (trimmed.includes('<?xml') ||
          trimmed.includes('<yml_catalog') ||
          trimmed.includes('<rss') ||
          trimmed.includes('<shop') ||
          trimmed.includes('<offers'));
      const isCsv = trimmed.includes(';') || trimmed.includes(',') || trimmed.includes('\t');
      if (!isXml && !isCsv) {
        throw new BadRequestException(
          'INVALID_FEED_CONTENT: Uploaded content is neither valid XML nor CSV feed',
        );
      }
    }

    const feedSourceId = `feed_${dto.supplierId}_${Date.now().toString(36)}`;
    const job = await this.feedQueue.add(
      'ingest-feed',
      {
        supplierId: dto.supplierId,
        fileName: dto.fileName,
        feedSourceId,
        userId: user.id,
      },
      {
        jobId: `feed_${dto.supplierId}_${Date.now()}`,
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    );

    return {
      success: true,
      jobId: job.id!,
      feedSourceId,
      status: 'QUEUED',
    };
  }
}
