import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  Role,
  TargetApp,
  CreateNavigationItemDto,
  UpdateNavigationItemDto,
  ReorderNavigationItemsDto,
  PlanType,
} from '@smartfeed/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GetAccessibleNavigationQuery } from './queries/get-accessible-navigation.query';
import { GetAllNavigationItemsQuery } from './queries/get-all-navigation-items.query';
import { CreateNavigationItemCommand } from './commands/create-navigation-item.command';
import { UpdateNavigationItemCommand } from './commands/update-navigation-item.command';
import { DeleteNavigationItemCommand } from './commands/delete-navigation-item.command';
import { ReorderNavigationItemsCommand } from './commands/reorder-navigation-items.command';
import { GetLicenseByUserIdQuery } from '../licenses/queries/get-license-by-user-id.query';

@ApiTags('Navigation')
@Controller('navigation')
export class NavigationController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get accessible navigation items for the authenticated user' })
  @ApiQuery({ name: 'app', enum: TargetApp, required: false })
  @ApiResponse({ status: 200, description: 'List of accessible navigation items' })
  async getAccessibleNavigation(@CurrentUser() user: any, @Query('app') app?: TargetApp) {
    const license = await this.queryBus.execute(new GetLicenseByUserIdQuery(user.id));
    const userPlan = (license?.planType as PlanType) || PlanType.FREE;
    const targetApp = app || TargetApp.DESKTOP;

    return this.queryBus.execute(
      new GetAccessibleNavigationQuery(user.role as Role, userPlan, targetApp),
    );
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all navigation items for management (Admin only)' })
  @ApiQuery({ name: 'app', enum: TargetApp, required: false })
  async getAllForAdmin(@CurrentUser() user: any, @Query('app') app?: TargetApp) {
    if (user.role !== Role.SUPER_ADMIN && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only administrators can access this endpoint');
    }

    return this.queryBus.execute(new GetAllNavigationItemsQuery(app));
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new navigation item (Admin only)' })
  async createItem(@CurrentUser() user: any, @Body() dto: CreateNavigationItemDto) {
    if (user.role !== Role.SUPER_ADMIN && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only administrators can create navigation items');
    }

    return this.commandBus.execute(new CreateNavigationItemCommand(dto));
  }

  @Patch('reorder')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder navigation items (Admin only)' })
  async reorderItems(@CurrentUser() user: any, @Body() dto: ReorderNavigationItemsDto) {
    if (user.role !== Role.SUPER_ADMIN && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only administrators can reorder navigation items');
    }

    return this.commandBus.execute(new ReorderNavigationItemsCommand(dto));
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a navigation item (Admin only)' })
  async updateItem(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateNavigationItemDto,
  ) {
    if (user.role !== Role.SUPER_ADMIN && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only administrators can update navigation items');
    }

    return this.commandBus.execute(new UpdateNavigationItemCommand(id, dto));
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a navigation item (Admin only)' })
  async deleteItem(@CurrentUser() user: any, @Param('id') id: string) {
    if (user.role !== Role.SUPER_ADMIN && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only administrators can delete navigation items');
    }

    return this.commandBus.execute(new DeleteNavigationItemCommand(id));
  }
}
