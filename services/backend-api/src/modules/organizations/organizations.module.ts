import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '../../prisma/prisma.module';
import { OrganizationsController } from './organizations.controller';
import { InviteMemberHandler } from './commands/invite-member.handler';
import { RemoveMemberHandler } from './commands/remove-member.handler';
import { UpdateOrganizationHandler } from './commands/update-organization.handler';
import { GetUserOrganizationsHandler } from './queries/get-user-organizations.handler';
import { GetOrganizationByIdHandler } from './queries/get-organization-by-id.handler';
import { GetOrganizationMembersHandler } from './queries/get-organization-members.handler';

const CommandHandlers = [InviteMemberHandler, RemoveMemberHandler, UpdateOrganizationHandler];

const QueryHandlers = [
  GetUserOrganizationsHandler,
  GetOrganizationByIdHandler,
  GetOrganizationMembersHandler,
];

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [OrganizationsController],
  providers: [...CommandHandlers, ...QueryHandlers],
  exports: [...CommandHandlers, ...QueryHandlers],
})
export class OrganizationsModule {}
