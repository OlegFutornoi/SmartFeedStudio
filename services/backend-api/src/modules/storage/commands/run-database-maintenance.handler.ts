import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RunDatabaseMaintenanceCommand } from '@/modules/storage/commands/run-database-maintenance.command';
import { DatabaseMaintenanceResultDto } from '@smartfeed/shared';
import { runMaintenanceOnDisk } from '@/modules/storage/utils/workspace-utils';

@CommandHandler(RunDatabaseMaintenanceCommand)
export class RunDatabaseMaintenanceHandler implements ICommandHandler<RunDatabaseMaintenanceCommand> {
  async execute(command: RunDatabaseMaintenanceCommand): Promise<DatabaseMaintenanceResultDto> {
    return runMaintenanceOnDisk(command.workspacePath);
  }
}
