import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '@/prisma/prisma.module';
import { NavigationController } from '@/modules/navigation/navigation.controller';
import { CreateNavigationItemHandler } from '@/modules/navigation/commands/create-navigation-item.handler';
import { UpdateNavigationItemHandler } from '@/modules/navigation/commands/update-navigation-item.handler';
import { DeleteNavigationItemHandler } from '@/modules/navigation/commands/delete-navigation-item.handler';
import { ReorderNavigationItemsHandler } from '@/modules/navigation/commands/reorder-navigation-items.handler';
import { GetAccessibleNavigationHandler } from '@/modules/navigation/queries/get-accessible-navigation.handler';
import { GetAllNavigationItemsHandler } from '@/modules/navigation/queries/get-all-navigation-items.handler';

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
