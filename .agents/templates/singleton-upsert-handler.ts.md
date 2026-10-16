# Golden Path: Atomic Upsert Handler for 1:1 Relations (`BE-07`)

```ts
// services/backend-api/src/modules/suppliers/commands/handlers/update-supplier-sync-settings.handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateSupplierSyncSettingsCommand } from '@/modules/suppliers/commands/suppliers.commands';

@CommandHandler(UpdateSupplierSyncSettingsCommand)
export class UpdateSupplierSyncSettingsHandler implements ICommandHandler<UpdateSupplierSyncSettingsCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateSupplierSyncSettingsCommand) {
    const { supplierId, userId, dto } = command;

    // Verify tenant ownership of parent
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, userId },
      select: { id: true },
    });
    if (!supplier) {
      throw new NotFoundException(`Supplier ${supplierId} not found`);
    }

    // Atomic upsert: zero TOCTOU race conditions
    return this.prisma.supplierSyncSetting.upsert({
      where: { supplierId },
      update: { ...dto },
      create: { supplierId, ...dto },
    });
  }
}
```
