import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private client: Redis | null = null;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    try {
      const host = this.configService.get<string>('REDIS_HOST', 'localhost');
      const port = Number(this.configService.get<number>('REDIS_PORT', 6379));
      const password = this.configService.get<string>('REDIS_PASSWORD') || undefined;

      this.client = new Redis({
        host,
        port,
        password,
        lazyConnect: true,
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
      });

      this.client
        .connect()
        .then(() => {
          this.isConnected = true;
          this.logger.log(`Connected to Redis cache at ${host}:${port}`);
        })
        .catch((err) => {
          this.isConnected = false;
          this.logger.warn(`Redis cache unavailable (${err.message}). Falling back to direct DB.`);
        });
    } catch (err: unknown) {
      this.isConnected = false;
      this.logger.warn(`Failed to initialize Redis client: ${err}`);
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      try {
        await this.client.quit();
      } catch {
        // Ignore disconnect error during shutdown
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.client) return null;
    try {
      const data = await this.client.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds = 3600): Promise<void> {
    if (!this.isConnected || !this.client) return;
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      // Ignore cache write error
    }
  }

  async del(keyPattern: string): Promise<void> {
    if (!this.isConnected || !this.client) return;
    try {
      const keys = await this.client.keys(keyPattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch {
      // Ignore cache del error
    }
  }
}
