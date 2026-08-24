import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '../../prisma/prisma.module';
import { NavigationController } from './navigation.controller';
import { CreateNavigationItemHandler } from './commands/create-navigation-item.handler';
import { UpdateNavigationItemHandler } from './commands/update-navigation-item.handler';
import { DeleteNavigationItemHandler } from './commands/delete-navigation-item.handler';
import { ReorderNavigationItemsHandler } from './commands/reorder-navigation-items.handler';
import { GetAccessibleNavigationHandler } from './queries/get-accessible-navigation.handler';
import { GetAllNavigationItemsHandler } from './queries/get-all-navigation-items.handler';

export const CommandHandlers = [
  CreateNavigationItemHandler,
  UpdateNavigationItemHandler,
  DeleteNavigationItemHandler,
  ReorderNavigationItemsHandler,
];

export const QueryHandlers = [GetAccessibleNavigationHandler, GetAllNavigationItemsHandler];

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [NavigationController],
  providers: [...CommandHandlers, ...QueryHandlers],
  exports: [...CommandHandlers, ...QueryHandlers],
})
export class NavigationModule {}
