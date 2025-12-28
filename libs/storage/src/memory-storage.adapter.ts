import { Injectable, Inject } from '@nestjs/common';
import { DISMISSIBLE_LOGGER, IDismissibleLogger } from '@dismissible/nestjs-logger';
import { IDismissibleStorage } from './storage.interface';
import { DismissibleItemDto } from '@dismissible/nestjs-dismissible-item';

/**
 * In-memory storage provider for dismissible items.
 * Suitable for development and testing; not for production use.
 */
@Injectable()
export class MemoryStorageAdapter implements IDismissibleStorage {
  private readonly storage = new Map<string, DismissibleItemDto>();

  constructor(@Inject(DISMISSIBLE_LOGGER) private readonly logger: IDismissibleLogger) {}

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

  /**
   * Clear all stored items.
   * Useful for testing.
   */
  clear(): void {
    this.logger.debug(`Storage clear`, { previousSize: this.storage.size });
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
