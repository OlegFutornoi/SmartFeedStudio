import { UpdateAiAssistantProfileDto } from '@smartfeed/shared';

export class UpdateAiAssistantProfileCommand {
  constructor(public readonly dto: UpdateAiAssistantProfileDto) {}
}
