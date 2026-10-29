import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '@/prisma/prisma.module';
import { LegalController } from '@/modules/legal/legal.controller';
import { LegalService } from '@/modules/legal/legal.service';
import { GetLegalDocumentsHandler } from '@/modules/legal/queries/handlers/get-legal-documents.handler';
import { GetLegalDocumentBySlugHandler } from '@/modules/legal/queries/handlers/get-legal-document-by-slug.handler';
import { CreateLegalDocumentHandler } from '@/modules/legal/commands/handlers/create-legal-document.handler';
import { UpdateLegalDocumentHandler } from '@/modules/legal/commands/handlers/update-legal-document.handler';
import { DeleteLegalDocumentHandler } from '@/modules/legal/commands/handlers/delete-legal-document.handler';

const Handlers = [
  GetLegalDocumentsHandler,
  GetLegalDocumentBySlugHandler,
  CreateLegalDocumentHandler,
  UpdateLegalDocumentHandler,
  DeleteLegalDocumentHandler,
];

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [LegalController],
  providers: [LegalService, ...Handlers],
  exports: [LegalService, ...Handlers],
})
export class LegalModule {}
