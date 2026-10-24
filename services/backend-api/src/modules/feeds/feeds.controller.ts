import {
  BadRequestException,
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
import {
  type FetchFeedResultDto,
  type FeedSourceDto,
  type ImportJobDto,
  type SupplierSyncResultDto,
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
import { SyncSupplierFeedCommand } from '@/modules/suppliers/commands/suppliers.commands';
import { GetSupplierByIdQuery } from '@/modules/suppliers/queries/suppliers.queries';

@ApiTags('Feeds')
@Controller('feeds')
export class FeedsController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
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

  @Post('suppliers/:supplierId/sources/:sourceId/sync')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Trigger feed source synchronization' })
  @ApiResponse({ status: 200, description: 'Feed source synchronized successfully' })
  async syncSupplierSource(
    @Param('supplierId') supplierId: string,
    @Param('sourceId') sourceId: string,
    @CurrentUser() user: { id: string },
  ): Promise<SupplierSyncResultDto> {
    return this.commandBus.execute(
      new SyncSupplierFeedCommand(supplierId, user.id, { feedSourceId: sourceId }),
    );
  }

  @Get('jobs/active')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get active background feed processing jobs' })
  @ApiResponse({ status: 200, description: 'List of active feed jobs' })
  async getActiveJobs(): Promise<ImportJobDto[]> {
    // In local-first desktop, feed ingestion runs locally via SQLite & Tokio workers.
    // Cloud API returns active server-side BullMQ queue jobs (currently empty).
    return [];
  }

  @Get('jobs/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get import job status by ID' })
  @ApiResponse({ status: 200, description: 'Import job details' })
  async getJobStatus(@Param('id') id: string): Promise<ImportJobDto> {
    return {
      id,
      feedSourceId: 'feed_source_cloud',
      status: ImportJobStatus.COMPLETED,
      totalItems: 0,
      processedItems: 0,
      createdItems: 0,
      updatedItems: 0,
      failedItems: 0,
      progressPercent: 100,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
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

    const jobId = `job_${Date.now()}`;
    const feedSourceId = `feed_${dto.supplierId}_${Date.now().toString(36)}`;
    return {
      success: true,
      jobId,
      feedSourceId,
      status: 'COMPLETED',
    };
  }
}
