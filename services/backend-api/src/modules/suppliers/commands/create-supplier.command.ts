import { CreateSupplierDto } from '../dto/create-supplier.dto';

export class CreateSupplierCommand {
  constructor(
    public readonly userId: string,
    public readonly dto: CreateSupplierDto,
    public readonly organizationId?: string,
  ) {}
}
