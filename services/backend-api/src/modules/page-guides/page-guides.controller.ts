import { Controller, Get, Put, Body, Param, NotFoundException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { GetPageGuidesQuery } from '@/modules/page-guides/queries/get-page-guides.query';
import { GetAiAssistantProfileQuery } from '@/modules/page-guides/queries/get-ai-assistant-profile.query';
import { UpdateAiAssistantProfileCommand } from '@/modules/page-guides/commands/update-ai-assistant-profile.command';
import {
  PageGuideResponseDto,
  AiAssistantProfileResponseDto,
} from '@/modules/page-guides/dto/page-guide-response.dto';
import { UpdateAiAssistantProfileRequestDto } from '@/modules/page-guides/dto/update-ai-assistant-profile.dto';
import { PageGuideDto, AiAssistantProfileDto, Role } from '@smartfeed/shared';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';

@ApiTags('Page Guides & AI Assistant')
@Controller('page-guides')
export class PageGuidesController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('assistant/profile')
  @ApiOperation({ summary: 'Get current AI Assistant avatar and profile configuration' })
  @ApiResponse({
    status: 200,
    description: 'AI Assistant profile returned successfully',
    type: AiAssistantProfileResponseDto,
  })
  async getAssistantProfile(): Promise<AiAssistantProfileDto> {
    return this.queryBus.execute(new GetAiAssistantProfileQuery());
  }

  @Put('assistant/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update AI Assistant avatar and profile configuration' })
  @ApiResponse({
    status: 200,
    description: 'AI Assistant profile updated successfully',
    type: AiAssistantProfileResponseDto,
  })
  async updateAssistantProfile(
    @Body() dto: UpdateAiAssistantProfileRequestDto,
  ): Promise<AiAssistantProfileDto> {
    return this.commandBus.execute(new UpdateAiAssistantProfileCommand(dto));
  }

  @Get()
  @ApiOperation({ summary: 'List all application page guides with AI explanations' })
  @ApiResponse({
    status: 200,
    description: 'List of page guides returned successfully',
    type: [PageGuideResponseDto],
  })
  async getAllPageGuides(): Promise<PageGuideDto[]> {
    const guides = await this.queryBus.execute(new GetPageGuidesQuery());
    return (Array.isArray(guides) ? guides : []) as PageGuideDto[];
  }

  @Get(':routeKey')
  @ApiOperation({ summary: 'Get contextual AI page guide for a specific route' })
  @ApiParam({ name: 'routeKey', description: 'URL route (e.g. cloud-sync, catalogs, suppliers)' })
  @ApiResponse({
    status: 200,
    description: 'Page guide returned successfully',
    type: PageGuideResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Page guide not found' })
  async getPageGuide(@Param('routeKey') routeKey: string): Promise<PageGuideDto> {
    const guide = await this.queryBus.execute(new GetPageGuidesQuery(routeKey));
    if (!guide || Array.isArray(guide)) {
      throw new NotFoundException(`Page guide for route "${routeKey}" not found`);
    }
    return guide as PageGuideDto;
  }
}
