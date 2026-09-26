import { ICommand } from '@nestjs/cqrs';
import { SimulateSandboxWebhookDto } from '../dto/simulate-sandbox-webhook.dto';

export class SimulateSandboxWebhookCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly dto: SimulateSandboxWebhookDto,
  ) {}
}
