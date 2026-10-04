import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateUserHandler } from '@/modules/users/commands/create-user.handler';
import { CreateUserByAdminHandler } from '@/modules/users/commands/create-user-by-admin.handler';
import { UpdateUserStatusHandler } from '@/modules/users/commands/update-user-status.handler';
import { DeleteUserHandler } from '@/modules/users/commands/delete-user.handler';
import { ChangePasswordHandler } from '@/modules/users/commands/change-password.handler';
import { ResetPasswordHandler } from '@/modules/users/commands/reset-password.handler';
import { UpdateUserAvatarHandler } from '@/modules/users/commands/update-user-avatar.handler';
import { GetUserByEmailHandler } from '@/modules/users/queries/get-user-by-email.handler';
import { GetUserByIdHandler } from '@/modules/users/queries/get-user-by-id.handler';
import { GetUsersListHandler } from '@/modules/users/queries/get-users-list.handler';
import { GetUsersStatsHandler } from '@/modules/users/queries/get-users-stats.handler';
import { UsersController } from '@/modules/users/users.controller';

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
