#!/usr/bin/env node
import { execSync } from 'node:child_process';

const DEFAULT_DEV_PORTS = [1420, 3000, 4000, 4321, 5555];

const requestedPorts = process.argv
  .slice(2)
  .map((arg) => parseInt(arg, 10))
  .filter((p) => !isNaN(p) && p > 0);

const targetPorts = requestedPorts.length > 0 ? requestedPorts : DEFAULT_DEV_PORTS;

function freePort(port) {
  if (process.platform === 'win32') {
    try {
      const output = execSync(`netstat -ano | findstr :${port}`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      const lines = output.trim().split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(pid) && pid !== process.pid && pid !== process.ppid) {
          try {
            execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
            console.log(`🧹 [Ports] Freed port ${port} (killed PID ${pid})`);
          } catch {
            // Already exited
          }
        }
      }
    } catch {
      // No process found on this port
    }
    return;
  }

  // macOS and Linux
  try {
    const stdout = execSync(`lsof -tiTCP:${port} -sTCP:LISTEN`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();

    if (!stdout) return;

    const pids = stdout
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean);

    for (const pidStr of pids) {
      const pid = parseInt(pidStr, 10);
      if (isNaN(pid) || pid === process.pid || pid === process.ppid) continue;

      let comm = '';
      try {
        comm = execSync(`ps -p ${pid} -o comm=`, {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'ignore'],
        })
          .trim()
          .toLowerCase();
      } catch {
        // Process might have already exited
      }

      // Never kill Docker daemon host process (Docker Desktop maps container ports)
      if (comm.includes('docker') || comm.includes('com.docker')) {
        continue;
      }

      try {
        process.kill(pid, 'SIGKILL');
        console.log(`🧹 [Ports] Freed port ${port} (terminated PID ${pid}: ${comm || 'process'})`);
      } catch {
        // Already exited
      }
    }
  } catch {
    // Exit code 1 means no process is listening on this port — perfectly normal
  }
}

for (const port of targetPorts) {
  freePort(port);
}
