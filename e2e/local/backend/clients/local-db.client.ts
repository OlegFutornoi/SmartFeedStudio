import { APIRequestContext } from '@playwright/test';

export interface LocalDbHealth {
  status: string;
  dbPath: string;
  tablesCount: number;
  tables: string[];
  schemaFingerprint?: string;
  schemaFileHash?: string;
}

export class LocalDbClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly baseUrl: string,
  ) {}

  async health(): Promise<LocalDbHealth> {
    const res = await this.request.get(`${this.baseUrl}/health`);
    if (res.status() !== 200) {
      throw new Error(`Local DB health check failed with status ${res.status()}`);
    }
    return res.json();
  }

  async reset(): Promise<void> {
    const res = await this.request.post(`${this.baseUrl}/api/reset`);
    if (res.status() !== 200) {
      throw new Error(`Local DB reset failed with status ${res.status()}`);
    }
  }

  async invoke<T = unknown>(command: string, args: Record<string, unknown> = {}): Promise<T> {
    const res = await this.request.post(`${this.baseUrl}/api/invoke`, {
      data: { command, args },
    });

    if (res.status() !== 200) {
      const err = await res.text();
      throw new Error(`Local DB invoke '${command}' failed: ${err}`);
    }

    return res.json();
  }
}
