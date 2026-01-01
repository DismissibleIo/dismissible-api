import { Injectable, Inject } from '@nestjs/common';
import { LRUCache } from 'lru-cache';
import { DISMISSIBLE_LOGGER, IDismissibleLogger } from '@dismissible/nestjs-logger';
import { IDismissibleStorage } from './storage.interface';
import { DismissibleItemDto } from '@dismissible/nestjs-item';

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

  constructor(@Inject(DISMISSIBLE_LOGGER) private readonly logger: IDismissibleLogger) {
    this.storage = new LRUCache<string, DismissibleItemDto>({
      max: 5000,
      ttl: 6 * 60 * 60 * 1000, // 6 hours
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

  async create(item: DismissibleItemDto): Promise<DismissibleItemDto> {
    const key = this.createKey(item.userId, item.id);
    this.logger.debug(`Storage create`, { userId: item.userId, itemId: item.id, key });
    this.storage.set(key, item);
    return item;
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
