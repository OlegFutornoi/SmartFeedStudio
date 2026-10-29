import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateLegalDocumentCommand } from '@/modules/legal/commands/legal.commands';

@CommandHandler(UpdateLegalDocumentCommand)
export class UpdateLegalDocumentHandler implements ICommandHandler<UpdateLegalDocumentCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateLegalDocumentCommand): Promise<{ id: string }> {
    const { id, dto } = command;

    const existing = await this.prisma.legalDocument.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Legal document with id "${id}" not found`);
    }

    const updated = await this.prisma.legalDocument.update({
      where: { id },
      data: {
        titleUk: dto.titleUk,
        titleEn: dto.titleEn,
        contentUk: dto.contentUk,
        contentEn: dto.contentEn,
        isPublished: dto.isPublished,
        version: dto.version,
      },
    });

    return { id: updated.id };
  }
}
