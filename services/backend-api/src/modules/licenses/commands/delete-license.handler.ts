import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { DeleteLicenseCommand } from '@/modules/licenses/commands/delete-license.command';

@Injectable()
@CommandHandler(DeleteLicenseCommand)
export class DeleteLicenseHandler implements ICommandHandler<
  DeleteLicenseCommand,
  { success: boolean }
> {
  private readonly logger = new Logger(DeleteLicenseHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteLicenseCommand): Promise<{ success: boolean }> {
    const { licenseId } = command;

    const existing = await this.prisma.license.findUnique({
      where: { id: licenseId },
    });

    if (!existing) {
      throw new NotFoundException(`License with ID ${licenseId} not found`);
    }

    await this.prisma.license.delete({
      where: { id: licenseId },
    });

    this.logger.log(`Deleted license ${existing.licenseKey} (ID: ${licenseId})`);

    return { success: true };
  }
}
