import { ProductFilterQueryDto } from '../dto/product-filter.dto';

export class GetProductsQuery {
  constructor(
    public readonly userId: string,
    public readonly filter: ProductFilterQueryDto,
  ) {}
}
