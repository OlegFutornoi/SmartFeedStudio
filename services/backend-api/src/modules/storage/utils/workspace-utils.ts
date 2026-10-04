/**
 * Facade module re-exporting disk, backup, and dialog storage utilities.
 * Maintained for 100% backward compatibility with clean domain decomposition (<250 lines).
 */

export {
  resolveWorkspacePath,
  validateWorkspacePath,
  calculateDirSizeBytes,
  calculateDirSizeBytesAsync,
  initWorkspaceOnDisk,
  readWorkspaceInfo,
  openInOsFileManager,
  migrateWorkspaceOnDisk,
} from '@/modules/storage/utils/workspace-disk';

export {
  createBackupFileOnDisk,
  clearCacheOnDisk,
  runMaintenanceOnDisk,
} from '@/modules/storage/utils/workspace-backup';

export { selectFolderDialog } from '@/modules/storage/utils/workspace-dialogs';
