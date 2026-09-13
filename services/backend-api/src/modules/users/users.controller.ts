import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GetUsersListQuery } from './queries/get-users-list.query';
import { GetUsersStatsQuery } from './queries/get-users-stats.query';
import {
  CreateUserByAdminDto,
  CreateUserByAdminDtoSchema,
  Role,
  UpdateUserStatusDto,
  UpdateUserStatusDtoSchema,
  UserListItemDto,
  UsersStatsDto,
} from '@smartfeed/shared';
import { CreateUserByAdminCommand } from './commands/create-user-by-admin.command';
import { UpdateUserStatusCommand } from './commands/update-user-status.command';
import { DeleteUserCommand } from './commands/delete-user.command';
import { CreateUserByAdminRequestDto, UpdateUserStatusRequestDto } from './dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Get list of users with their licenses' })
  @ApiResponse({ status: 200, description: 'List of users returned' })
  @ApiResponse({ status: 403, description: 'Forbidden: Admin access required' })
  async getUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('orgRoleFilter') orgRoleFilter?: 'ALL' | 'OWNERS' | 'MEMBERS',
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<UserListItemDto[]> {
    return this.queryBus.execute(
      new GetUsersListQuery(
        search,
        role,
        orgRoleFilter,
        limit ? Number(limit) : 50,
        offset ? Number(offset) : 0,
      ),
    );
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Get user statistics for admin dashboard' })
  @ApiResponse({ status: 200, description: 'User statistics returned' })
  @ApiResponse({ status: 403, description: 'Forbidden: Admin access required' })
  async getStats(): Promise<UsersStatsDto> {
    return this.queryBus.execute(new GetUsersStatsQuery());
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user (Admin Portal)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async createUserByAdmin(@Body() body: CreateUserByAdminRequestDto): Promise<UserListItemDto> {
    const dto: CreateUserByAdminDto = CreateUserByAdminDtoSchema.parse(body);
    return this.commandBus.execute(new CreateUserByAdminCommand(dto));
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Update user active/suspended status' })
  @ApiResponse({ status: 200, description: 'User status updated successfully' })
  @ApiResponse({ status: 400, description: 'Cannot suspend own account' })
  @ApiResponse({ status: 403, description: 'Cannot suspend super admin' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUserStatus(
    @Param('id') userId: string,
    @Body() body: UpdateUserStatusRequestDto,
    @CurrentUser('id') requesterId: string,
  ): Promise<UserListItemDto> {
    const dto: UpdateUserStatusDto = UpdateUserStatusDtoSchema.parse(body);
    return this.commandBus.execute(new UpdateUserStatusCommand(userId, dto.isActive, requesterId));
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete user account (Admin Portal)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete own account' })
  @ApiResponse({ status: 403, description: 'Cannot delete super admin' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(
    @Param('id') userId: string,
    @CurrentUser('id') requesterId: string,
  ): Promise<{ success: boolean }> {
    return this.commandBus.execute(new DeleteUserCommand(userId, requesterId));
  }
}
