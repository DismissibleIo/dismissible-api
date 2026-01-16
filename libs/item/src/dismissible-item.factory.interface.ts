import { DismissibleItemDto } from './dismissible-item';
import { ICreateDismissibleItemOptions } from './dismissible-item.factory';

/**
 * Injection token for the dismissible item factory provider.
 */
export const DISMISSIBLE_ITEM_FACTORY = Symbol('DISMISSIBLE_ITEM_FACTORY');

/**
 * Interface for dismissible item factory providers.
 */
export interface IDismissibleItemFactory {
  /**
   * Create a new DismissibleItemDto instance from the provided options.
   */
  create(options: ICreateDismissibleItemOptions): DismissibleItemDto;

  /**
   * Create a clone of an existing DismissibleItemDto.
   */
  clone(item: DismissibleItemDto): DismissibleItemDto;

  /**
   * Create a dismissed version of an existing item.
   */
  createDismissed(item: DismissibleItemDto, dismissedAt: Date): DismissibleItemDto;

  /**
   * Create a restored (non-dismissed) version of an existing item.
   */
  createRestored(item: DismissibleItemDto): DismissibleItemDto;
}
