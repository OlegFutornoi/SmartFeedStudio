import { ICommand } from '@nestjs/cqrs';
import { Role } from '@smartfeed/shared';

export class CreateUserCommand implements ICommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly fullName?: string,
    public readonly role: Role = Role.USER,
  ) {}
}
