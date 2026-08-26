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
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
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
  async getAccessibleNavigation(
    @CurrentUser() user: { id: string; role: Role },
    @Query('app') app?: TargetApp,
  ) {
    const license = await this.queryBus.execute(new GetLicenseByUserIdQuery(user.id));
    const userPlan = (license?.planType as PlanType) || PlanType.FREE;
    const targetApp = app || TargetApp.DESKTOP;

    return this.queryBus.execute(new GetAccessibleNavigationQuery(user.role, userPlan, targetApp));
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all navigation items for management (Admin only)' })
  @ApiQuery({ name: 'app', enum: TargetApp, required: false })
  async getAllForAdmin(@Query('app') app?: TargetApp) {
    return this.queryBus.execute(new GetAllNavigationItemsQuery(app));
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new navigation item (Admin only)' })
  async createItem(@Body() dto: CreateNavigationItemDto) {
    return this.commandBus.execute(new CreateNavigationItemCommand(dto));
  }

  @Patch('reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder navigation items (Admin only)' })
  async reorderItems(@Body() dto: ReorderNavigationItemsDto) {
    return this.commandBus.execute(new ReorderNavigationItemsCommand(dto));
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a navigation item (Admin only)' })
  async updateItem(@Param('id') id: string, @Body() dto: UpdateNavigationItemDto) {
    return this.commandBus.execute(new UpdateNavigationItemCommand(id, dto));
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a navigation item (Admin only)' })
  async deleteItem(@Param('id') id: string) {
    return this.commandBus.execute(new DeleteNavigationItemCommand(id));
  }
}
