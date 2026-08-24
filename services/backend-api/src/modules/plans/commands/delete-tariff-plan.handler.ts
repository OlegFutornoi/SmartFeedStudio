import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { DeleteTariffPlanCommand } from './delete-tariff-plan.command';

@Injectable()
@CommandHandler(DeleteTariffPlanCommand)
export class DeleteTariffPlanHandler implements ICommandHandler<
  DeleteTariffPlanCommand,
  { success: boolean; id: string }
> {
  private readonly logger = new Logger(DeleteTariffPlanHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteTariffPlanCommand): Promise<{ success: boolean; id: string }> {
    const { id } = command;

    const existing = await this.prisma.tariffPlan.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Tariff plan with ID "${id}" not found`);
    }

    await this.prisma.tariffPlan.delete({
      where: { id },
    });

    this.logger.log(`Deleted tariff plan id=${id}, code=${existing.code}`);

    return { success: true, id };
  }
}
