import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@/prisma/prisma.module';
import { OrganizationsController } from '@/modules/organizations/organizations.controller';
import { InvitationsController } from '@/modules/organizations/invitations.controller';
import { InviteMemberHandler } from '@/modules/organizations/commands/invite-member.handler';
import { RemoveMemberHandler } from '@/modules/organizations/commands/remove-member.handler';
import { UpdateOrganizationHandler } from '@/modules/organizations/commands/update-organization.handler';
import { RevokeInvitationHandler } from '@/modules/organizations/commands/revoke-invitation.handler';
import { AcceptInvitationHandler } from '@/modules/organizations/commands/accept-invitation.handler';
import { GetUserOrganizationsHandler } from '@/modules/organizations/queries/get-user-organizations.handler';
import { GetOrganizationByIdHandler } from '@/modules/organizations/queries/get-organization-by-id.handler';
import { GetOrganizationMembersHandler } from '@/modules/organizations/queries/get-organization-members.handler';
import { GetOrganizationInvitationsHandler } from '@/modules/organizations/queries/get-organization-invitations.handler';
import { GetInvitationByTokenHandler } from '@/modules/organizations/queries/get-invitation-by-token.handler';

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
