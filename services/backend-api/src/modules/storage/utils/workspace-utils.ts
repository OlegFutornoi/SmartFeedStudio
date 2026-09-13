/**
 * Facade module re-exporting disk, backup, and dialog storage utilities.
 * Maintained for 100% backward compatibility with clean domain decomposition (<250 lines).
 */

export {
  resolveWorkspacePath,
  validateWorkspacePath,
  calculateDirSizeBytes,
  initWorkspaceOnDisk,
  readWorkspaceInfo,
  openInOsFileManager,
  migrateWorkspaceOnDisk,
} from './workspace-disk';

export { createBackupFileOnDisk, clearCacheOnDisk, runMaintenanceOnDisk } from './workspace-backup';

export { selectFolderDialog } from './workspace-dialogs';
