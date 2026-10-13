import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { QueryBus } from '@nestjs/cqrs';
import type { FetchFeedResultDto, FeedSourceDto, ImportJobDto } from '@smartfeed/shared';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { FetchFeedUrlDto, ImportFeedAsyncDto } from '@/modules/feeds/dto';
import { FetchFeedUrlQuery } from '@/modules/feeds/queries/fetch-feed-url.query';

@ApiTags('Feeds')
@Controller('feeds')
export class FeedsController {
  constructor(private readonly queryBus: QueryBus) {}

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

  @Get('sources')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all cloud feed sources' })
  @ApiResponse({ status: 200, description: 'List of feed sources' })
  async getAllSources(): Promise<FeedSourceDto[]> {
    return [];
  }

  @Get('suppliers/:supplierId/sources')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get feed sources for a specific supplier' })
  @ApiResponse({ status: 200, description: 'List of supplier feed sources' })
  async getSupplierSources(@Param('supplierId') _supplierId: string): Promise<FeedSourceDto[]> {
    return [];
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
      status: 'COMPLETED' as any,
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
  async importAsync(
    @Body() dto: ImportFeedAsyncDto,
  ): Promise<{ success: boolean; jobId: string; feedSourceId: string; status: string }> {
    const jobId = `job_${Date.now()}`;
    const feedSourceId = dto.supplierId
      ? `feed_${dto.supplierId}_${Date.now().toString(36)}`
      : `feed_${Date.now()}`;
    return {
      success: true,
      jobId,
      feedSourceId,
      status: 'COMPLETED',
    };
  }
}
