import Redis from 'ioredis';
import { randomUUID } from 'node:crypto';
import { Logger } from '@nestjs/common';

const LUA_RELEASE_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
else
    return 0
end
`;

/**
 * Distributed keyed mutex using Redis with safe Lua release script (BE-07, DEF-05).
 * Falls back to in-memory serialized mutex when Redis is unreachable or in tests.
 */
class OrganizationMutex {
  private readonly logger = new Logger(OrganizationMutex.name);
  private readonly inMemoryLocks = new Map<string, Promise<void>>();
  private redisClient: Redis | null = null;
  private isRedisReady = false;

  constructor() {
    this.initRedis();
  }

  private initRedis() {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = Number(process.env.REDIS_PORT || 6379);
    const password = process.env.REDIS_PASSWORD || undefined;

    if (process.env.NODE_ENV === 'test' && !process.env.REDIS_HOST) {
      return;
    }

    try {
      this.redisClient = new Redis({
        host,
        port,
        password,
        lazyConnect: true,
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
      });

      this.redisClient
        .connect()
        .then(() => {
          this.isRedisReady = true;
          this.logger.log(`Distributed mutex initialized on Redis ${host}:${port}`);
        })
        .catch(() => {
          this.isRedisReady = false;
        });
    } catch {
      this.isRedisReady = false;
    }
  }

  async runExclusive<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (this.isRedisReady && this.redisClient) {
      return this.runExclusiveRedis(key, fn);
    }
    return this.runExclusiveInMemory(key, fn);
  }

  private async runExclusiveRedis<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const lockKey = `lock:mutex:${key}`;
    const lockValue = randomUUID();
    const ttlMs = 15000;
    const maxWaitMs = 10000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      try {
        const acquired = await this.redisClient!.set(lockKey, lockValue, 'PX', ttlMs, 'NX');
        if (acquired === 'OK') {
          try {
            return await fn();
          } finally {
            try {
              await this.redisClient!.eval(LUA_RELEASE_SCRIPT, 1, lockKey, lockValue);
            } catch (releaseErr) {
              this.logger.warn(`Failed to release Redis lock ${lockKey}: ${releaseErr}`);
            }
          }
        }
      } catch (err) {
        this.logger.warn(`Redis lock error on ${lockKey}, falling back to in-memory mutex: ${err}`);
        return this.runExclusiveInMemory(key, fn);
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    throw new Error(`Timeout acquiring distributed lock for key: ${key}`);
  }

  private async runExclusiveInMemory<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const currentLock = this.inMemoryLocks.get(key) ?? Promise.resolve();
    let release: () => void;
    const nextLock = new Promise<void>((resolve) => {
      release = resolve;
    });

    this.inMemoryLocks.set(
      key,
      currentLock.then(() => nextLock),
    );

    try {
      await currentLock;
      return await fn();
    } finally {
      release!();
      if (this.inMemoryLocks.get(key) === nextLock) {
        this.inMemoryLocks.delete(key);
      }
    }
  }
}

export const organizationMutex = new OrganizationMutex();
