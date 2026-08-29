import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '../../prisma/prisma.module';
import { SuppliersController } from './suppliers.controller';
import { CreateSupplierHandler } from './commands/create-supplier.handler';
import { UpdateSupplierHandler } from './commands/update-supplier.handler';
import { DeleteSupplierHandler } from './commands/delete-supplier.handler';
import { GetSuppliersHandler } from './queries/get-suppliers.handler';
import { GetSupplierByIdHandler } from './queries/get-supplier-by-id.handler';

const CommandHandlers = [CreateSupplierHandler, UpdateSupplierHandler, DeleteSupplierHandler];

const QueryHandlers = [GetSuppliersHandler, GetSupplierByIdHandler];

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [SuppliersController],
  providers: [...CommandHandlers, ...QueryHandlers],
  exports: [...CommandHandlers, ...QueryHandlers],
})
export class SuppliersModule {}
