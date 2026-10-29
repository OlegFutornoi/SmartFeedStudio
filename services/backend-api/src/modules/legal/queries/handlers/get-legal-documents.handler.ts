import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '@/prisma/prisma.service';
import { GetLegalDocumentsQuery } from '@/modules/legal/queries/legal.queries';

@QueryHandler(GetLegalDocumentsQuery)
export class GetLegalDocumentsHandler implements IQueryHandler<GetLegalDocumentsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetLegalDocumentsQuery) {
    const { publishedOnly } = query;
    return this.prisma.legalDocument.findMany({
      where: publishedOnly ? { isPublished: true } : undefined,
      orderBy: { createdAt: 'asc' },
    });
  }
}
