import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { GetLegalDocumentBySlugQuery } from '@/modules/legal/queries/legal.queries';

@QueryHandler(GetLegalDocumentBySlugQuery)
export class GetLegalDocumentBySlugHandler implements IQueryHandler<GetLegalDocumentBySlugQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetLegalDocumentBySlugQuery) {
    const { slug } = query;
    const doc = await this.prisma.legalDocument.findUnique({
      where: { slug },
    });

    if (!doc || !doc.isPublished) {
      throw new NotFoundException(`Legal document with slug "${slug}" not found`);
    }

    return doc;
  }
}
