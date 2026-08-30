import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { InviteMemberCommand } from './commands/invite-member.command';
import { RemoveMemberCommand } from './commands/remove-member.command';
import { UpdateOrganizationCommand } from './commands/update-organization.command';
import { RevokeInvitationCommand } from './commands/revoke-invitation.command';
import { GetUserOrganizationsQuery } from './queries/get-user-organizations.query';
import { GetOrganizationByIdQuery } from './queries/get-organization-by-id.query';
import { GetOrganizationMembersQuery } from './queries/get-organization-members.query';
import { GetOrganizationInvitationsQuery } from './queries/get-organization-invitations.query';

@ApiTags('Organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiOperation({ summary: "Get current user's organizations" })
  @ApiResponse({ status: 200, description: 'List of user organizations' })
  async getUserOrganizations(@CurrentUser('id') userId: string) {
    return this.queryBus.execute(new GetUserOrganizationsQuery(userId));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization details by ID' })
  @ApiResponse({ status: 200, description: 'Organization details with quotas and member counts' })
  async getOrganizationById(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.queryBus.execute(new GetOrganizationByIdQuery(id, userId));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update organization name' })
  @ApiResponse({ status: 200, description: 'Updated organization' })
  async updateOrganization(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.commandBus.execute(new UpdateOrganizationCommand(id, userId, dto.name));
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get organization members list' })
  @ApiResponse({ status: 200, description: 'List of members' })
  async getOrganizationMembers(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.queryBus.execute(new GetOrganizationMembersQuery(id, userId));
  }

  @Post(':id/members')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Invite a team member (checks maxTeamSeats quota)' })
  @ApiResponse({ status: 201, description: 'Invitation created and link generated' })
  @ApiResponse({ status: 403, description: 'TEAM_SEATS_LIMIT_EXCEEDED when quota is exhausted' })
  async inviteMember(
    @Param('id') id: string,
    @Body() dto: InviteMemberDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.commandBus.execute(new InviteMemberCommand(id, userId, dto.email, dto.role));
  }

  @Get(':id/invitations')
  @ApiOperation({ summary: 'Get pending invitations list for organization' })
  @ApiResponse({ status: 200, description: 'List of pending invitations' })
  async getOrganizationInvitations(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.queryBus.execute(new GetOrganizationInvitationsQuery(id, userId));
  }

  @Post(':id/invitations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an invitation for team member' })
  @ApiResponse({ status: 201, description: 'Invitation created and link generated' })
  async createInvitation(
    @Param('id') id: string,
    @Body() dto: InviteMemberDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.commandBus.execute(new InviteMemberCommand(id, userId, dto.email, dto.role));
  }

  @Delete(':id/invitations/:invitationId')
  @ApiOperation({ summary: 'Revoke/cancel a pending invitation' })
  @ApiResponse({ status: 200, description: 'Invitation revoked successfully' })
  async revokeInvitation(
    @Param('id') id: string,
    @Param('invitationId') invitationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.commandBus.execute(new RevokeInvitationCommand(id, userId, invitationId));
  }

  @Delete(':id/members/:memberId')
  @ApiOperation({ summary: 'Remove a team member (liberates a seat)' })
  @ApiResponse({ status: 200, description: 'Member removed successfully' })
  async removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.commandBus.execute(new RemoveMemberCommand(id, userId, memberId));
  }
}
