import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProductsController } from './products.controller';
import { CreateProductHandler } from './commands/create-product.handler';
import { UpdateProductHandler } from './commands/update-product.handler';
import { DeleteProductHandler } from './commands/delete-product.handler';
import { GetProductsHandler } from './queries/get-products.handler';
import { GetProductByIdHandler } from './queries/get-product-by-id.handler';

import { BulkDeleteProductsHandler } from './commands/bulk-delete-products.handler';
import { GetCategoriesSummaryHandler } from './queries/get-categories-summary.handler';

const CommandHandlers = [
  CreateProductHandler,
  UpdateProductHandler,
  DeleteProductHandler,
  BulkDeleteProductsHandler,
];

const QueryHandlers = [GetProductsHandler, GetProductByIdHandler, GetCategoriesSummaryHandler];

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [ProductsController],
  providers: [...CommandHandlers, ...QueryHandlers],
  exports: [...CommandHandlers, ...QueryHandlers],
})
export class ProductsModule {}
