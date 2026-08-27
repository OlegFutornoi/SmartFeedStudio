import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { OrganizationsController } from './organizations.controller';
import { InvitationsController } from './invitations.controller';
import { InviteMemberHandler } from './commands/invite-member.handler';
import { RemoveMemberHandler } from './commands/remove-member.handler';
import { UpdateOrganizationHandler } from './commands/update-organization.handler';
import { RevokeInvitationHandler } from './commands/revoke-invitation.handler';
import { AcceptInvitationHandler } from './commands/accept-invitation.handler';
import { GetUserOrganizationsHandler } from './queries/get-user-organizations.handler';
import { GetOrganizationByIdHandler } from './queries/get-organization-by-id.handler';
import { GetOrganizationMembersHandler } from './queries/get-organization-members.handler';
import { GetOrganizationInvitationsHandler } from './queries/get-organization-invitations.handler';
import { GetInvitationByTokenHandler } from './queries/get-invitation-by-token.handler';

const CommandHandlers = [
  InviteMemberHandler,
  RemoveMemberHandler,
  UpdateOrganizationHandler,
  RevokeInvitationHandler,
  AcceptInvitationHandler,
];

const QueryHandlers = [
  GetUserOrganizationsHandler,
  GetOrganizationByIdHandler,
  GetOrganizationMembersHandler,
  GetOrganizationInvitationsHandler,
  GetInvitationByTokenHandler,
];

@Module({
  imports: [CqrsModule, PrismaModule, JwtModule.register({}), ConfigModule],
  controllers: [OrganizationsController, InvitationsController],
  providers: [...CommandHandlers, ...QueryHandlers],
  exports: [...CommandHandlers, ...QueryHandlers],
})
export class OrganizationsModule {}
