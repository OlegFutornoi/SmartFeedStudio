import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '@/prisma/prisma.module';
import { SuppliersController } from '@/modules/suppliers/suppliers.controller';
import {
  GetSuppliersHandler,
  GetSupplierByIdHandler,
  GetSupplierCategoriesHandler,
  GetSupplierPricingRulesHandler,
} from '@/modules/suppliers/queries/suppliers.handlers';
import { SupplierCommandHandlers } from '@/modules/suppliers/commands/suppliers.handlers';
import {
  GetSupplierSyncSettingsHandler,
  GetSupplierSyncLogsHandler,
} from '@/modules/suppliers/queries/supplier-sync.handlers';

export const CommandHandlers = SupplierCommandHandlers;

export const QueryHandlers = [
  GetSuppliersHandler,
  GetSupplierByIdHandler,
  GetSupplierCategoriesHandler,
  GetSupplierPricingRulesHandler,
  GetSupplierSyncSettingsHandler,
  GetSupplierSyncLogsHandler,
];

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [SuppliersController],
  providers: [...CommandHandlers, ...QueryHandlers],
  exports: [...CommandHandlers, ...QueryHandlers],
})
export class SuppliersModule {}
