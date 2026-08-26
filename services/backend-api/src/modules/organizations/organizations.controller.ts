import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { InviteMemberCommand } from './commands/invite-member.command';
import { RemoveMemberCommand } from './commands/remove-member.command';
import { UpdateOrganizationCommand } from './commands/update-organization.command';
import { GetUserOrganizationsQuery } from './queries/get-user-organizations.query';
import { GetOrganizationByIdQuery } from './queries/get-organization-by-id.query';
import { GetOrganizationMembersQuery } from './queries/get-organization-members.query';

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
  async getUserOrganizations(@Request() req: any) {
    return this.queryBus.execute(new GetUserOrganizationsQuery(req.user.id));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization details by ID' })
  @ApiResponse({ status: 200, description: 'Organization details with quotas and member counts' })
  async getOrganizationById(@Param('id') id: string, @Request() req: any) {
    return this.queryBus.execute(new GetOrganizationByIdQuery(id, req.user.id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update organization name' })
  @ApiResponse({ status: 200, description: 'Updated organization' })
  async updateOrganization(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
    @Request() req: any,
  ) {
    return this.commandBus.execute(new UpdateOrganizationCommand(id, req.user.id, dto.name));
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get organization members list' })
  @ApiResponse({ status: 200, description: 'List of members' })
  async getOrganizationMembers(@Param('id') id: string, @Request() req: any) {
    return this.queryBus.execute(new GetOrganizationMembersQuery(id, req.user.id));
  }

  @Post(':id/members')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Invite or add a team member (checks maxTeamSeats quota)' })
  @ApiResponse({ status: 201, description: 'Member added successfully' })
  @ApiResponse({ status: 403, description: 'TEAM_SEATS_LIMIT_EXCEEDED when quota is exhausted' })
  async inviteMember(@Param('id') id: string, @Body() dto: InviteMemberDto, @Request() req: any) {
    return this.commandBus.execute(new InviteMemberCommand(id, req.user.id, dto.email, dto.role));
  }

  @Delete(':id/members/:memberId')
  @ApiOperation({ summary: 'Remove a team member (liberates a seat)' })
  @ApiResponse({ status: 200, description: 'Member removed successfully' })
  async removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Request() req: any,
  ) {
    return this.commandBus.execute(new RemoveMemberCommand(id, req.user.id, memberId));
  }
}
