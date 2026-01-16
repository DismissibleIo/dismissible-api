import { DismissibleItemDto } from '@dismissible/nestjs-item';

/**
 * Injection token for the dismissible helper provider.
 */
export const DISMISSIBLE_HELPER = Symbol('DISMISSIBLE_HELPER');

/**
 * Interface for dismissible helper providers.
 */
export interface IDismissibleHelper {
  /**
   * Check if an item is dismissed.
   */
  isDismissed(item: DismissibleItemDto): boolean;
}
