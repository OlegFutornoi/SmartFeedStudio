import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GetUsersListQuery } from './queries/get-users-list.query';
import { GetUsersStatsQuery } from './queries/get-users-stats.query';
import { ChangePasswordCommand } from './commands/change-password.command';
import { ChangePasswordDto, UserListItemDto, UsersStatsDto } from '@smartfeed/shared';

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
  @ApiOperation({ summary: 'Get list of users with their licenses' })
  @ApiResponse({ status: 200, description: 'List of users returned' })
  async getUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<UserListItemDto[]> {
    return this.queryBus.execute(
      new GetUsersListQuery(search, role, limit ? Number(limit) : 50, offset ? Number(offset) : 0),
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics for admin dashboard' })
  @ApiResponse({ status: 200, description: 'User statistics returned' })
  async getStats(): Promise<UsersStatsDto> {
    return this.queryBus.execute(new GetUsersStatsQuery());
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password for current authenticated user' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Current password is incorrect' })
  async changePassword(@CurrentUser('id') userId: string, @Body() dto: ChangePasswordDto) {
    return this.commandBus.execute(
      new ChangePasswordCommand(userId, dto.currentPassword, dto.newPassword),
    );
  }
}
