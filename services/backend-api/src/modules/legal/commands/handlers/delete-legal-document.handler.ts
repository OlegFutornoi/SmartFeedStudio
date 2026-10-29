import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { DeleteLegalDocumentCommand } from '@/modules/legal/commands/legal.commands';

@CommandHandler(DeleteLegalDocumentCommand)
export class DeleteLegalDocumentHandler implements ICommandHandler<DeleteLegalDocumentCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteLegalDocumentCommand): Promise<{ success: boolean }> {
    const { id } = command;

    const existing = await this.prisma.legalDocument.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Legal document with id "${id}" not found`);
    }

    await this.prisma.legalDocument.delete({
      where: { id },
    });

    return { success: true };
  }
}
