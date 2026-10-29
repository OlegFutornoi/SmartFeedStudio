import { ICommand } from '@nestjs/cqrs';
import { CreateLegalDocumentDto } from '@/modules/legal/dto/create-legal-document.dto';
import { UpdateLegalDocumentDto } from '@/modules/legal/dto/update-legal-document.dto';

export class CreateLegalDocumentCommand implements ICommand {
  constructor(public readonly dto: CreateLegalDocumentDto) {}
}

export class UpdateLegalDocumentCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly dto: UpdateLegalDocumentDto,
  ) {}
}

export class DeleteLegalDocumentCommand implements ICommand {
  constructor(public readonly id: string) {}
}
