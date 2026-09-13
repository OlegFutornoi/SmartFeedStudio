import * as os from 'os';
import { execFile } from 'child_process';

export async function selectFolderDialog(): Promise<string | null> {
  const platform = os.platform();

  return new Promise((resolve) => {
    if (platform === 'darwin') {
      const args = [
        '-e',
        'try',
        '-e',
        'set folderPath to POSIX path of (choose folder with prompt "Оберіть папку для SmartFeed Studio:")',
        '-e',
        'return folderPath',
        '-e',
        'on error',
        '-e',
        'return ""',
        '-e',
        'end try',
      ];

      execFile('osascript', args, { timeout: 120000, shell: false }, (error, stdout) => {
        if (error || !stdout) {
          resolve(null);
          return;
        }
        const trimmed = stdout.trim();
        resolve(trimmed && trimmed !== '' ? trimmed : null);
      });
    } else if (platform === 'win32') {
      const psScript = [
        'Add-Type -AssemblyName System.Windows.Forms;',
        '$f = New-Object System.Windows.Forms.FolderBrowserDialog;',
        '$f.Description = "Select workspace storage folder";',
        'if ($f.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $f.SelectedPath }',
      ].join(' ');

      execFile(
        'powershell.exe',
        ['-NoProfile', '-NonInteractive', '-Command', psScript],
        { timeout: 120000, shell: false },
        (error, stdout) => {
          if (error || !stdout) {
            resolve(null);
            return;
          }
          const trimmed = stdout.trim();
          resolve(trimmed && trimmed !== '' ? trimmed : null);
        },
      );
    } else {
      // Linux / BSD: Try zenity with safe argument list
      execFile(
        'zenity',
        ['--file-selection', '--directory', '--title=Select workspace folder'],
        { timeout: 120000, shell: false },
        (error, stdout) => {
          if (!error && stdout && stdout.trim()) {
            resolve(stdout.trim());
            return;
          }
          // Fallback to kdialog
          execFile(
            'kdialog',
            ['--getexistingdirectory', 'Select workspace folder'],
            { timeout: 120000, shell: false },
            (kErr, kStdout) => {
              if (!kErr && kStdout && kStdout.trim()) {
                resolve(kStdout.trim());
                return;
              }
              resolve(null);
            },
          );
        },
      );
    }
  });
}
