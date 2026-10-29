import { IQuery } from '@nestjs/cqrs';

export class GetLegalDocumentsQuery implements IQuery {
  constructor(public readonly publishedOnly: boolean = false) {}
}

export class GetLegalDocumentBySlugQuery implements IQuery {
  constructor(public readonly slug: string) {}
}
