import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConflictException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateLegalDocumentCommand } from '@/modules/legal/commands/legal.commands';

@CommandHandler(CreateLegalDocumentCommand)
export class CreateLegalDocumentHandler implements ICommandHandler<CreateLegalDocumentCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateLegalDocumentCommand): Promise<{ id: string }> {
    const { dto } = command;

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.legalDocument.findUnique({
        where: { slug: dto.slug },
      });

      if (existing) {
        throw new ConflictException(`Legal document with slug "${dto.slug}" already exists`);
      }

      const created = await tx.legalDocument.create({
        data: {
          slug: dto.slug,
          titleUk: dto.titleUk,
          titleEn: dto.titleEn,
          contentUk: dto.contentUk,
          contentEn: dto.contentEn,
          isPublished: dto.isPublished ?? false,
          version: dto.version ?? '1.0',
        },
      });

      return { id: created.id };
    });
  }
}
