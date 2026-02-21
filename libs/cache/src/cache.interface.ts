import { DismissibleItemDto } from '@dismissible/nestjs-item';

/**
 * Injection token for the cache provider.
 */
export const DISMISSIBLE_CACHE_ADAPTER = Symbol('DISMISSIBLE_CACHE_ADAPTER');

/**
 * Interface for cache providers.
 * Implementations handle caching of dismissible items.
 */
export interface IDismissibleCache {
  /**
   * Retrieve an item from cache by user ID and item ID.
   * @param userId The user identifier
   * @param itemId The item identifier
   * @returns The item or null if not found in cache
   */
  get(userId: string, itemId: string): Promise<DismissibleItemDto | null>;

  /**
   * Retrieve multiple items from cache by user ID and item IDs.
   * @param userId The user identifier
   * @param itemIds Array of item identifiers
   * @returns Map of itemId to item for items found in cache
   */
  getMany(userId: string, itemIds: string[]): Promise<Map<string, DismissibleItemDto>>;

  /**
   * Store an item in cache.
   * @param item The item to cache (contains userId and id)
   */
  set(item: DismissibleItemDto): Promise<void>;

  /**
   * Store multiple items in cache.
   * @param items Array of items to cache (each contains userId and id)
   */
  setMany(items: DismissibleItemDto[]): Promise<void>;

  /**
   * Remove an item from cache by user ID and item ID.
   * @param userId The user identifier
   * @param itemId The item identifier
   */
  delete(userId: string, itemId: string): Promise<void>;

  /**
   * Remove multiple items from cache by user ID and item IDs.
   * @param userId The user identifier
   * @param itemIds Array of item identifiers
   */
  deleteMany(userId: string, itemIds: string[]): Promise<void>;
}
