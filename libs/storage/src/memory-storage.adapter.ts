import { Injectable, Inject } from '@nestjs/common';
import { LRUCache } from 'lru-cache';
import { DISMISSIBLE_LOGGER, IDismissibleLogger } from '@dismissible/nestjs-logger';
import { IDismissibleStorage } from './storage.interface';
import { DismissibleItemDto } from '@dismissible/nestjs-item';
import { MemoryStorageConfig } from './memory-storage.config';

const DEFAULT_MAX_ITEMS = 5000;
const DEFAULT_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * In-memory storage provider for dismissible items with LRU eviction.
 * Suitable for development and testing; not for production use.
 *
 * Automatically evicts items when:
 * - The cache exceeds the maximum number of items (default: 5000)
 * - Items are older than the maximum age (default: 6 hours)
 */
@Injectable()
export class MemoryStorageAdapter implements IDismissibleStorage {
  private readonly storage: LRUCache<string, DismissibleItemDto>;

  constructor(
    private readonly config: MemoryStorageConfig,
    @Inject(DISMISSIBLE_LOGGER) private readonly logger: IDismissibleLogger,
  ) {
    this.storage = new LRUCache<string, DismissibleItemDto>({
      max: config.maxItems ?? DEFAULT_MAX_ITEMS,
      ttl: config.ttlMs ?? DEFAULT_TTL_MS,
    });
  }

  /**
   * Create a storage key from userId and itemId.
   */
  private createKey(userId: string, itemId: string): string {
    return `${userId}:${itemId}`;
  }

  async get(userId: string, itemId: string): Promise<DismissibleItemDto | null> {
    const key = this.createKey(userId, itemId);
    this.logger.debug(`Storage get`, { userId, itemId, key });

    const item = this.storage.get(key);

    if (!item) {
      this.logger.debug(`Storage miss`, { userId, itemId });
      return null;
    }

    this.logger.debug(`Storage hit`, { userId, itemId });
    return item;
  }

  async getMany(userId: string, itemIds: string[]): Promise<Map<string, DismissibleItemDto>> {
    this.logger.debug(`Storage getMany`, { userId, itemCount: itemIds.length });

    const result = new Map<string, DismissibleItemDto>();

    for (const itemId of itemIds) {
      const key = this.createKey(userId, itemId);
      const item = this.storage.get(key);
      if (item) {
        result.set(itemId, item);
      }
    }

    this.logger.debug(`Storage getMany complete`, {
      userId,
      requested: itemIds.length,
      found: result.size,
    });

    return result;
  }

  async create(item: DismissibleItemDto): Promise<DismissibleItemDto> {
    const key = this.createKey(item.userId, item.id);
    this.logger.debug(`Storage create`, { userId: item.userId, itemId: item.id, key });
    this.storage.set(key, item);
    return item;
  }

  async createMany(items: DismissibleItemDto[]): Promise<DismissibleItemDto[]> {
    this.logger.debug(`Storage createMany`, { itemCount: items.length });

    for (const item of items) {
      const key = this.createKey(item.userId, item.id);
      this.storage.set(key, item);
    }

    this.logger.debug(`Storage createMany complete`, { created: items.length });

    return items;
  }

  async update(item: DismissibleItemDto): Promise<DismissibleItemDto> {
    const key = this.createKey(item.userId, item.id);
    this.logger.debug(`Storage update`, { userId: item.userId, itemId: item.id, key });
    this.storage.set(key, item);
    return item;
  }

  async delete(userId: string, itemId: string): Promise<void> {
    const key = this.createKey(userId, itemId);
    this.logger.debug(`Storage delete`, { userId, itemId, key });
    this.storage.delete(key);
  }

  async deleteAll(): Promise<void> {
    this.logger.debug(`Storage deleteAll`, { previousSize: this.storage.size });
    this.storage.clear();
  }

  /**
   * Get the number of stored items.
   * Useful for testing/debugging.
   */
  get size(): number {
    return this.storage.size;
  }
}
