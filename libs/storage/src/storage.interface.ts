import { DismissibleItemDto } from '@dismissible/nestjs-item';

/**
 * Injection token for the storage provider.
 */
export const DISMISSIBLE_STORAGE_ADAPTER = Symbol('DISMISSIBLE_STORAGE_ADAPTER');

/**
 * Interface for storage providers.
 * Implementations handle the persistence of dismissible items.
 */
export interface IDismissibleStorage {
  /**
   * Retrieve an item by user ID and item ID.
   * @param userId The user identifier
   * @param itemId The item identifier
   * @returns The item or null if not found
   */
  get(userId: string, itemId: string): Promise<DismissibleItemDto | null>;

  /**
   * Retrieve multiple items by user ID and item IDs.
   * @param userId The user identifier
   * @param itemIds Array of item identifiers
   * @returns Map of itemId to item for items that exist
   */
  getMany(userId: string, itemIds: string[]): Promise<Map<string, DismissibleItemDto>>;

  /**
   * Create a new item.
   * @param item The item to create (contains userId and id)
   * @returns The created item
   */
  create(item: DismissibleItemDto): Promise<DismissibleItemDto>;

  /**
   * Create multiple items.
   * @param items Array of items to create (each contains userId and id)
   * @returns Array of created items
   */
  createMany(items: DismissibleItemDto[]): Promise<DismissibleItemDto[]>;

  /**
   * Update an existing item.
   * @param item The item to update (contains userId and id)
   * @returns The updated item
   */
  update(item: DismissibleItemDto): Promise<DismissibleItemDto>;

  /**
   * Delete an item by user ID and item ID.
   * @param userId The user identifier
   * @param itemId The item identifier
   */
  delete(userId: string, itemId: string): Promise<void>;

  /**
   * Delete all items.
   * Useful for cleanup operations.
   */
  deleteAll(): Promise<void>;
}
