import { Injectable, Inject } from '@nestjs/common';
import { DISMISSIBLE_LOGGER, IDismissibleLogger } from '@dismissible/nestjs-logger';
import { IDismissibleCache } from '@dismissible/nestjs-cache';
import { DismissibleItemDto } from '@dismissible/nestjs-item';
import { RedisClientService } from './redis-client.service';
import { RedisCacheConfig, DISMISSIBLE_REDIS_CACHE_CONFIG } from './redis-cache.config';

const DEFAULT_KEY_PREFIX = 'dismissible:cache:';
const DEFAULT_TTL_SECONDS = 6 * 60 * 60; // 6 hours

/**
 * Redis cache adapter for dismissible items.
 * Provides distributed caching using Redis.
 */
@Injectable()
export class RedisCacheAdapter implements IDismissibleCache {
  private readonly keyPrefix: string;
  private readonly ttlSeconds: number;

  constructor(
    private readonly redisClient: RedisClientService,
    @Inject(DISMISSIBLE_REDIS_CACHE_CONFIG) private readonly config: RedisCacheConfig,
    @Inject(DISMISSIBLE_LOGGER) private readonly logger: IDismissibleLogger,
  ) {
    this.keyPrefix = config.keyPrefix ?? DEFAULT_KEY_PREFIX;
    this.ttlSeconds = config.ttlMs ? Math.floor(config.ttlMs / 1000) : DEFAULT_TTL_SECONDS;
  }

  /**
   * Create a cache key from userId and itemId.
   */
  private createKey(userId: string, itemId: string): string {
    return `${this.keyPrefix}${userId}:${itemId}`;
  }

  /**
   * Serialize DismissibleItemDto to JSON string.
   */
  private serialize(item: DismissibleItemDto): string {
    return JSON.stringify({
      id: item.id,
      userId: item.userId,
      createdAt: item.createdAt.toISOString(),
      dismissedAt: item.dismissedAt?.toISOString() ?? null,
    });
  }

  /**
   * Deserialize JSON string to DismissibleItemDto.
   */
  private deserialize(data: string): DismissibleItemDto {
    const parsed = JSON.parse(data);
    return {
      id: parsed.id,
      userId: parsed.userId,
      createdAt: new Date(parsed.createdAt),
      dismissedAt: parsed.dismissedAt ? new Date(parsed.dismissedAt) : null,
    };
  }

  async get(userId: string, itemId: string): Promise<DismissibleItemDto | null> {
    const key = this.createKey(userId, itemId);
    this.logger.debug(`Cache get`, { userId, itemId, key });

    try {
      const data = await this.redisClient.getClient().get(key);

      if (!data) {
        this.logger.debug(`Cache miss`, { userId, itemId });
        return null;
      }

      const item = this.deserialize(data);
      this.logger.debug(`Cache hit`, { userId, itemId });
      return item;
    } catch (error) {
      this.logger.error(`Cache get error`, { userId, itemId, error: (error as Error).message });
      return null;
    }
  }

  async getMany(userId: string, itemIds: string[]): Promise<Map<string, DismissibleItemDto>> {
    this.logger.debug(`Cache getMany`, { userId, itemCount: itemIds.length });

    if (itemIds.length === 0) {
      return new Map();
    }

    const keys = itemIds.map((itemId) => this.createKey(userId, itemId));
    const result = new Map<string, DismissibleItemDto>();

    try {
      const values = await this.redisClient.getClient().mget(...keys);

      for (let i = 0; i < itemIds.length; i++) {
        const value = values[i];
        if (value) {
          try {
            const item = this.deserialize(value);
            result.set(itemIds[i], item);
          } catch (error) {
            this.logger.error(`Cache deserialize error`, {
              userId,
              itemId: itemIds[i],
              error: (error as Error).message,
            });
          }
        }
      }

      this.logger.debug(`Cache getMany complete`, {
        userId,
        requested: itemIds.length,
        found: result.size,
      });

      return result;
    } catch (error) {
      this.logger.error(`Cache getMany error`, {
        userId,
        itemCount: itemIds.length,
        error: (error as Error).message,
      });
      return new Map();
    }
  }

  async set(item: DismissibleItemDto): Promise<void> {
    const key = this.createKey(item.userId, item.id);
    this.logger.debug(`Cache set`, { userId: item.userId, itemId: item.id, key });

    try {
      const data = this.serialize(item);
      await this.redisClient.getClient().setex(key, this.ttlSeconds, data);
    } catch (error) {
      this.logger.error(`Cache set error`, {
        userId: item.userId,
        itemId: item.id,
        error: (error as Error).message,
      });
    }
  }

  async setMany(items: DismissibleItemDto[]): Promise<void> {
    this.logger.debug(`Cache setMany`, { itemCount: items.length });

    if (items.length === 0) {
      return;
    }

    try {
      const pipeline = this.redisClient.getClient().pipeline();

      for (const item of items) {
        const key = this.createKey(item.userId, item.id);
        const data = this.serialize(item);
        pipeline.setex(key, this.ttlSeconds, data);
      }

      await pipeline.exec();

      this.logger.debug(`Cache setMany complete`, { set: items.length });
    } catch (error) {
      this.logger.error(`Cache setMany error`, {
        itemCount: items.length,
        error: (error as Error).message,
      });
    }
  }

  async delete(userId: string, itemId: string): Promise<void> {
    const key = this.createKey(userId, itemId);
    this.logger.debug(`Cache delete`, { userId, itemId, key });

    try {
      await this.redisClient.getClient().del(key);
    } catch (error) {
      this.logger.error(`Cache delete error`, {
        userId,
        itemId,
        error: (error as Error).message,
      });
    }
  }

  async deleteMany(userId: string, itemIds: string[]): Promise<void> {
    this.logger.debug(`Cache deleteMany`, { userId, itemCount: itemIds.length });

    if (itemIds.length === 0) {
      return;
    }

    try {
      const keys = itemIds.map((itemId) => this.createKey(userId, itemId));
      await this.redisClient.getClient().del(...keys);

      this.logger.debug(`Cache deleteMany complete`, { deleted: itemIds.length });
    } catch (error: unknown) {
      this.logger.error(`Cache deleteMany error`, {
        userId,
        itemCount: itemIds.length,
        error: (error as Error).message,
      });
    }
  }
}
