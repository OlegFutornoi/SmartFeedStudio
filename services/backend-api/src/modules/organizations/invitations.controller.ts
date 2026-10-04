import { Controller, Get, Post, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { AcceptInvitationDto } from '@/modules/organizations/dto/accept-invitation.dto';
import { GetInvitationByTokenQuery } from '@/modules/organizations/queries/get-invitation-by-token.query';
import { AcceptInvitationCommand } from '@/modules/organizations/commands/accept-invitation.command';

@ApiTags('Invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get(':token')
  @ApiOperation({ summary: 'Get public invitation details by token' })
  @ApiResponse({
    status: 200,
    description: 'Invitation details with company name, email, and role',
  })
  @ApiResponse({ status: 404, description: 'Invitation not found or invalid token' })
  async getInvitationByToken(@Param('token') token: string) {
    return this.queryBus.execute(new GetInvitationByTokenQuery(token));
  }

  @Post('accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept invitation (register new user or join existing user)' })
  @ApiResponse({ status: 200, description: 'Invitation accepted and tokens generated' })
  @ApiResponse({ status: 400, description: 'Invalid token, expired, or invalid credentials' })
  @ApiResponse({ status: 403, description: 'TEAM_SEATS_LIMIT_EXCEEDED when quota is exhausted' })
  async acceptInvitation(
    @Body() dto: AcceptInvitationDto,
    @CurrentUser('id') authenticatedUserId?: string,
  ) {
    return this.commandBus.execute(
      new AcceptInvitationCommand(dto.token, dto.fullName, dto.password, authenticatedUserId),
    );
  }
}
