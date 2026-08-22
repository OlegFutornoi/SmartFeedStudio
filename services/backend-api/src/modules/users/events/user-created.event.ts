import { IEvent } from '@nestjs/cqrs';
import { Role, UserCreatedEventPayload } from '@smartfeed/shared';

export class UserCreatedEvent implements IEvent, UserCreatedEventPayload {
  public readonly occurredOn: Date;

  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly fullName: string | null,
    public readonly role: Role,
  ) {
    this.occurredOn = new Date();
  }
}
