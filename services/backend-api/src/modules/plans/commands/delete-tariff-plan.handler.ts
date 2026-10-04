import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisCacheService } from '@/common/cache/redis-cache.service';
import { DeleteTariffPlanCommand } from '@/modules/plans/commands/delete-tariff-plan.command';

@Injectable()
@CommandHandler(DeleteTariffPlanCommand)
export class DeleteTariffPlanHandler implements ICommandHandler<
  DeleteTariffPlanCommand,
  { success: boolean; id: string }
> {
  private readonly logger = new Logger(DeleteTariffPlanHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService,
  ) {}

  async execute(command: DeleteTariffPlanCommand): Promise<{ success: boolean; id: string }> {
    const { id } = command;

    const existing = await this.prisma.tariffPlan.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Tariff plan with ID "${id}" not found`);
    }

    const PROTECTED_SYSTEM_CODES = new Set(['STARTER', 'GROWTH', 'PRO', 'ENTERPRISE']);
    if (PROTECTED_SYSTEM_CODES.has(existing.code.toUpperCase().trim())) {
      throw new BadRequestException(
        `Cannot delete core system tariff plan "${existing.code}". You can deactivate it by setting isActive: false instead.`,
      );
    }

    await this.prisma.tariffPlan.delete({
      where: { id },
    });

    this.logger.log(`Deleted tariff plan id=${id}, code=${existing.code}`);
    await this.cache.del('tariff_plans:*');

    return { success: true, id };
  }
}
