import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { QueryBus } from '@nestjs/cqrs';
import type { FetchFeedResultDto } from '@smartfeed/shared';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { FetchFeedUrlDto } from '@/modules/feeds/dto/fetch-feed-url.dto';
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
}
