import { ICommand } from '@nestjs/cqrs';
import { WayForPayWebhookDto } from '@smartfeed/shared';

export class HandleWayForPayWebhookCommand implements ICommand {
  constructor(public readonly payload: WayForPayWebhookDto) {}
}
