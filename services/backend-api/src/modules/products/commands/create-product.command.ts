import { CreateProductDto } from '../dto/create-product.dto';

export class CreateProductCommand {
  constructor(
    public readonly userId: string,
    public readonly dto: CreateProductDto,
  ) {}
}
