import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateUserHandler } from './commands/create-user.handler';
import { CreateUserByAdminHandler } from './commands/create-user-by-admin.handler';
import { UpdateUserStatusHandler } from './commands/update-user-status.handler';
import { DeleteUserHandler } from './commands/delete-user.handler';
import { ChangePasswordHandler } from './commands/change-password.handler';
import { ResetPasswordHandler } from './commands/reset-password.handler';
import { UpdateUserAvatarHandler } from './commands/update-user-avatar.handler';
import { GetUserByEmailHandler } from './queries/get-user-by-email.handler';
import { GetUserByIdHandler } from './queries/get-user-by-id.handler';
import { GetUsersListHandler } from './queries/get-users-list.handler';
import { GetUsersStatsHandler } from './queries/get-users-stats.handler';
import { UsersController } from './users.controller';

export const CommandHandlers = [
  CreateUserHandler,
  CreateUserByAdminHandler,
  UpdateUserStatusHandler,
  DeleteUserHandler,
  ChangePasswordHandler,
  ResetPasswordHandler,
  UpdateUserAvatarHandler,
];
export const QueryHandlers = [
  GetUserByEmailHandler,
  GetUserByIdHandler,
  GetUsersListHandler,
  GetUsersStatsHandler,
];

@Module({
  imports: [CqrsModule],
  controllers: [UsersController],
  providers: [...CommandHandlers, ...QueryHandlers],
  exports: [CqrsModule],
})
export class UsersModule {}
