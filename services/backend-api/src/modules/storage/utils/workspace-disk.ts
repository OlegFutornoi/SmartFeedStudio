import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execFile } from 'child_process';
import { BadRequestException } from '@nestjs/common';
import { WorkspaceInfoDto } from '@smartfeed/shared';

export function validateWorkspacePath(inputPath?: string): void {
  if (!inputPath || inputPath.trim() === '') return;

  const trimmed = inputPath.trim();

  // 1. Path traversal check (prevent ../ or ..\ escaping)
  if (trimmed.includes('..') || trimmed.includes('\0')) {
    throw new BadRequestException(
      'Invalid workspace path: directory traversal sequences are strictly forbidden',
    );
  }

  // 2. Command injection / shell meta-characters check
  const forbiddenChars = /[;&|`$<>\r\n]/;
  if (forbiddenChars.test(trimmed)) {
    throw new BadRequestException(
      'Invalid workspace path: command injection characters are strictly forbidden',
    );
  }

  // 3. Prohibit targeting raw root or critical system directories
  const normalized = path.normalize(trimmed);
  const forbiddenRoots = [
    '/',
    '\\',
    '/etc',
    '/var',
    '/usr',
    '/bin',
    '/sbin',
    'C:\\',
    'C:\\Windows',
    'C:\\Program Files',
  ];
  if (forbiddenRoots.includes(normalized) || forbiddenRoots.includes(trimmed)) {
    throw new BadRequestException(
      'Invalid workspace path: targeting system root directories is forbidden',
    );
  }
}

export function resolveWorkspacePath(inputPath?: string): string {
  if (!inputPath || inputPath.trim() === '' || inputPath.trim() === '~') {
    const docs = path.join(os.homedir(), 'Documents');
    const base = fs.existsSync(docs) ? docs : os.homedir();
    return path.join(base, 'SmartFeedStudioData');
  }

  validateWorkspacePath(inputPath);

  let resolved = inputPath.trim();
  if (resolved.startsWith('~/') || resolved.startsWith('~\\')) {
    resolved = path.join(os.homedir(), resolved.slice(2));
  } else if (resolved === '~') {
    resolved = os.homedir();
  }

  return path.resolve(resolved);
}

export function calculateDirSizeBytes(dirPath: string): number {
  if (!fs.existsSync(dirPath)) {
    return 0;
  }

  const stat = fs.statSync(dirPath);
  if (stat.isFile()) {
    return stat.size;
  }

  let totalBytes = 0;
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        totalBytes += calculateDirSizeBytes(fullPath);
      } else if (entry.isFile()) {
        try {
          totalBytes += fs.statSync(fullPath).size;
        } catch {
          // Ignore transient file lock
        }
      }
    }
  } catch {
    // Ignore permissions/read errors
  }

  return totalBytes;
}

export function initWorkspaceOnDisk(targetPath: string): WorkspaceInfoDto {
  const rootPath = resolveWorkspacePath(targetPath);

  const subDirs = ['database', 'feeds', 'exports', 'backups', 'logs'];
  for (const sub of subDirs) {
    const fullSubPath = path.join(rootPath, sub);
    if (!fs.existsSync(fullSubPath)) {
      fs.mkdirSync(fullSubPath, { recursive: true });
    }
  }

  const dbPath = path.join(rootPath, 'database', 'catalog.db');
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, Buffer.alloc(0));
  }

  const configPath = path.join(rootPath, 'workspace.json');
  const nowIso = new Date().toISOString();

  const info: WorkspaceInfoDto = {
    workspacePath: rootPath,
    isInitialized: true,
    databasePath: dbPath,
    isEncrypted: true,
    encryptionAlgorithm: 'SQLCipher-AES256',
    createdAt: nowIso,
    lastBackupAt: undefined,
  };

  fs.writeFileSync(configPath, JSON.stringify(info, null, 2), 'utf-8');

  return info;
}

export function readWorkspaceInfo(targetPath?: string): WorkspaceInfoDto | null {
  const rootPath = resolveWorkspacePath(targetPath);

  if (!fs.existsSync(rootPath)) {
    return null;
  }

  const configPath = path.join(rootPath, 'workspace.json');
  if (fs.existsSync(configPath)) {
    try {
      const content = fs.readFileSync(configPath, 'utf-8');
      const parsed = JSON.parse(content) as WorkspaceInfoDto;
      return {
        ...parsed,
        workspacePath: rootPath,
        databasePath: path.join(rootPath, 'database', 'catalog.db'),
      };
    } catch (err) {
      console.warn('[WorkspaceDisk] Corrupt or unreadable workspace.json, falling back:', err);
    }
  }

  const dbPath = path.join(rootPath, 'database', 'catalog.db');
  if (fs.existsSync(dbPath)) {
    return {
      workspacePath: rootPath,
      isInitialized: true,
      databasePath: dbPath,
      isEncrypted: true,
      encryptionAlgorithm: 'SQLCipher-AES256',
      createdAt: new Date().toISOString(),
    };
  }

  return null;
}

export function openInOsFileManager(targetPath: string): void {
  const resolved = resolveWorkspacePath(targetPath);
  if (!fs.existsSync(resolved)) {
    fs.mkdirSync(resolved, { recursive: true });
  }

  const platform = os.platform();
  const handleError = (err: Error | null) => {
    if (err) {
      console.warn(`[Workspace] Failed to open in file manager: ${err.message}`);
    }
  };

  if (platform === 'darwin') {
    execFile('open', [resolved], handleError);
  } else if (platform === 'win32') {
    execFile('explorer', [resolved], handleError);
  } else {
    execFile('xdg-open', [resolved], handleError);
  }
}

export function migrateWorkspaceOnDisk(
  oldPath: string,
  newPath: string,
  moveData: boolean,
): WorkspaceInfoDto {
  const resolvedOld = resolveWorkspacePath(oldPath);
  const resolvedNew = resolveWorkspacePath(newPath);

  if (!fs.existsSync(resolvedNew)) {
    fs.mkdirSync(resolvedNew, { recursive: true });
  }

  const newInfo = initWorkspaceOnDisk(resolvedNew);

  if (moveData && fs.existsSync(resolvedOld)) {
    const subDirs = ['database', 'feeds', 'exports', 'backups', 'logs'];
    for (const sub of subDirs) {
      const srcSub = path.join(resolvedOld, sub);
      const dstSub = path.join(resolvedNew, sub);

      if (fs.existsSync(srcSub)) {
        try {
          fs.cpSync(srcSub, dstSub, { recursive: true, force: true });
        } catch (e) {
          console.warn(`Failed to copy ${srcSub} to ${dstSub}:`, e);
        }
      }
    }
  }

  return newInfo;
}
