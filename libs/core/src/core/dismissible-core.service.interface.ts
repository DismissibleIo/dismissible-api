import { DismissibleItemDto } from '@dismissible/nestjs-item';
import {
  IGetOrCreateServiceResponse,
  IDismissServiceResponse,
  IRestoreServiceResponse,
} from './service-responses.interface';

/**
 * Injection token for the dismissible core service provider.
 */
export const DISMISSIBLE_CORE_SERVICE = Symbol('DISMISSIBLE_CORE_SERVICE');

/**
 * Interface for dismissible core service providers.
 * Core business logic service for dismissible operations.
 */
export interface IDismissibleCoreService {
  /**
   * Get an existing item by user ID and item ID.
   * @param itemId The item identifier
   * @param userId The user identifier (required)
   * @returns The item or null if not found
   */
  get(itemId: string, userId: string): Promise<DismissibleItemDto | null>;

  /**
   * Create a new item.
   * @param itemId The item identifier
   * @param userId The user identifier (required)
   * @returns The created item
   */
  create(itemId: string, userId: string): Promise<DismissibleItemDto>;

  /**
   * Get an existing item or create a new one.
   * @param itemId The item identifier
   * @param userId The user identifier (required)
   */
  getOrCreate(itemId: string, userId: string): Promise<IGetOrCreateServiceResponse>;

  /**
   * Dismiss an item.
   * @param itemId The item identifier
   * @param userId The user identifier (required)
   * @throws ItemNotFoundException if item doesn't exist
   * @throws ItemAlreadyDismissedException if item is already dismissed
   */
  dismiss(itemId: string, userId: string): Promise<IDismissServiceResponse>;

  /**
   * Restore a dismissed item.
   * @param itemId The item identifier
   * @param userId The user identifier (required)
   * @throws ItemNotFoundException if item doesn't exist
   * @throws ItemNotDismissedException if item is not dismissed
   */
  restore(itemId: string, userId: string): Promise<IRestoreServiceResponse>;
}
