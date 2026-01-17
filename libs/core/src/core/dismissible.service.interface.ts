import { IRequestContext } from '@dismissible/nestjs-request';
import {
  IGetOrCreateServiceResponse,
  IBatchGetOrCreateServiceResponse,
  IDismissServiceResponse,
  IRestoreServiceResponse,
} from './service-responses.interface';

/**
 * Injection token for the dismissible service provider.
 */
export const DISMISSIBLE_SERVICE = Symbol('DISMISSIBLE_SERVICE');

/**
 * Interface for dismissible service providers.
 * Main orchestration service for dismissible operations.
 */
export interface IDismissibleService {
  /**
   * Get an existing item or create a new one.
   * @param itemId The item identifier
   * @param userId The user identifier (required)
   * @param context Optional request context for tracing
   */
  getOrCreate(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IGetOrCreateServiceResponse>;

  /**
   * Get existing items or create new ones for multiple item IDs.
   * @param itemIds Array of item identifiers (max 50)
   * @param userId The user identifier (required)
   * @param context Optional request context for tracing
   */
  batchGetOrCreate(
    itemIds: string[],
    userId: string,
    context?: IRequestContext,
  ): Promise<IBatchGetOrCreateServiceResponse>;

  /**
   * Dismiss an item.
   * @param itemId The item identifier
   * @param userId The user identifier (required)
   * @param context Optional request context for tracing
   */
  dismiss(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IDismissServiceResponse>;

  /**
   * Restore a dismissed item.
   * @param itemId The item identifier
   * @param userId The user identifier (required)
   * @param context Optional request context for tracing
   */
  restore(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IRestoreServiceResponse>;
}
