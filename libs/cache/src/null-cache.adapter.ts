import { IDismissibleCache } from './cache.interface';
import { DismissibleItemDto } from '@dismissible/nestjs-item';

/**
 * Null cache adapter that performs no operations.
 * Used when caching is not configured or disabled.
 * Follows the Null Object pattern for optional caching.
 */
export class NullCacheAdapter implements IDismissibleCache {
  async get(_userId: string, _itemId: string): Promise<DismissibleItemDto | null> {
    return null;
  }

  async getMany(_userId: string, _itemIds: string[]): Promise<Map<string, DismissibleItemDto>> {
    return new Map();
  }

  async set(_item: DismissibleItemDto): Promise<void> {
    // No-op
  }

  async setMany(_items: DismissibleItemDto[]): Promise<void> {
    // No-op
  }

  async delete(_userId: string, _itemId: string): Promise<void> {
    // No-op
  }

  async deleteMany(_userId: string, _itemIds: string[]): Promise<void> {
    // No-op
  }
}
