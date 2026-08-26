import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { UpdateNavigationItemCommand } from './update-navigation-item.command';
import { PrismaService } from '../../../prisma/prisma.service';

@CommandHandler(UpdateNavigationItemCommand)
export class UpdateNavigationItemHandler implements ICommandHandler<UpdateNavigationItemCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateNavigationItemCommand) {
    const { id, dto } = command;

    const existing = await this.prisma.navigationItem.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Navigation item with ID "${id}" not found`);
    }

    if (dto.key && dto.key !== existing.key) {
      const duplicateKey = await this.prisma.navigationItem.findUnique({
        where: { key: dto.key },
      });
      if (duplicateKey) {
        throw new ConflictException(`Navigation item with key "${dto.key}" already exists`);
      }
    }

    return this.prisma.navigationItem.update({
      where: { id },
      data: {
        ...(dto.key !== undefined && { key: dto.key }),
        ...(dto.labelUk !== undefined && { labelUk: dto.labelUk }),
        ...(dto.labelEn !== undefined && { labelEn: dto.labelEn }),
        ...(dto.path !== undefined && { path: dto.path }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.order !== undefined && { order: dto.order }),
        ...(dto.isVisible !== undefined && { isVisible: dto.isVisible }),
        ...(dto.requiredRoles !== undefined && { requiredRoles: dto.requiredRoles }),
        ...(dto.requiredPlan !== undefined && { requiredPlan: dto.requiredPlan }),
        ...(dto.targetApp !== undefined && { targetApp: dto.targetApp }),
      },
    });
  }
}
