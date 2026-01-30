import { Injectable, Inject } from '@nestjs/common';
import { LRUCache } from 'lru-cache';
import { DISMISSIBLE_LOGGER, IDismissibleLogger } from '@dismissible/nestjs-logger';
import { IDismissibleCache } from '@dismissible/nestjs-cache';
import { DismissibleItemDto } from '@dismissible/nestjs-item';
import { MemoryCacheConfig } from './memory-cache.config';

const DEFAULT_MAX_ITEMS = 5000;
const DEFAULT_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * In-memory cache provider for dismissible items with LRU eviction.
 * Suitable for development and testing; can be used in production for single-instance deployments.
 *
 * Automatically evicts items when:
 * - The cache exceeds the maximum number of items (default: 5000)
 * - Items are older than the maximum age (default: 6 hours)
 */
@Injectable()
export class MemoryCacheAdapter implements IDismissibleCache {
  private readonly cache: LRUCache<string, DismissibleItemDto>;

  constructor(
    private readonly config: MemoryCacheConfig,
    @Inject(DISMISSIBLE_LOGGER) private readonly logger: IDismissibleLogger,
  ) {
    this.cache = new LRUCache<string, DismissibleItemDto>({
      max: config.maxItems ?? DEFAULT_MAX_ITEMS,
      ttl: config.ttlMs ?? DEFAULT_TTL_MS,
    });
  }

  /**
   * Create a cache key from userId and itemId.
   */
  private createKey(userId: string, itemId: string): string {
    return `${userId}:${itemId}`;
  }

  async get(userId: string, itemId: string): Promise<DismissibleItemDto | null> {
    const key = this.createKey(userId, itemId);
    this.logger.debug(`Cache get`, { userId, itemId, key });

    const item = this.cache.get(key);

    if (!item) {
      this.logger.debug(`Cache miss`, { userId, itemId });
      return null;
    }

    this.logger.debug(`Cache hit`, { userId, itemId });
    return item;
  }

  async getMany(userId: string, itemIds: string[]): Promise<Map<string, DismissibleItemDto>> {
    this.logger.debug(`Cache getMany`, { userId, itemCount: itemIds.length });

    const result = new Map<string, DismissibleItemDto>();

    for (const itemId of itemIds) {
      const key = this.createKey(userId, itemId);
      const item = this.cache.get(key);
      if (item) {
        result.set(itemId, item);
      }
    }

    this.logger.debug(`Cache getMany complete`, {
      userId,
      requested: itemIds.length,
      found: result.size,
    });

    return result;
  }

  async set(item: DismissibleItemDto): Promise<void> {
    const key = this.createKey(item.userId, item.id);
    this.logger.debug(`Cache set`, { userId: item.userId, itemId: item.id, key });
    this.cache.set(key, item);
  }

  async setMany(items: DismissibleItemDto[]): Promise<void> {
    this.logger.debug(`Cache setMany`, { itemCount: items.length });

    for (const item of items) {
      const key = this.createKey(item.userId, item.id);
      this.cache.set(key, item);
    }

    this.logger.debug(`Cache setMany complete`, { set: items.length });
  }

  async delete(userId: string, itemId: string): Promise<void> {
    const key = this.createKey(userId, itemId);
    this.logger.debug(`Cache delete`, { userId, itemId, key });
    this.cache.delete(key);
  }

  async deleteMany(userId: string, itemIds: string[]): Promise<void> {
    this.logger.debug(`Cache deleteMany`, { userId, itemCount: itemIds.length });

    for (const itemId of itemIds) {
      const key = this.createKey(userId, itemId);
      this.cache.delete(key);
    }

    this.logger.debug(`Cache deleteMany complete`, { deleted: itemIds.length });
  }

  /**
   * Get the number of cached items.
   * Useful for testing/debugging.
   */
  get size(): number {
    return this.cache.size;
  }
}
