import { DismissibleItemDto } from '@dismissible/nestjs-dismissible-item';

/**
 * Response from getOrCreate operation.
 */
export interface IGetOrCreateServiceResponse {
  /** The item (either retrieved or created) */
  item: DismissibleItemDto;

  /** Whether the item was newly created */
  created: boolean;
}

/**
 * Response from dismiss operation.
 */
export interface IDismissServiceResponse {
  /** The dismissed item */
  item: DismissibleItemDto;

  /** The item state before dismissal */
  previousItem: DismissibleItemDto;
}

/**
 * Response from restore operation.
 */
export interface IRestoreServiceResponse {
  /** The restored item */
  item: DismissibleItemDto;

  /** The item state before restoration */
  previousItem: DismissibleItemDto;
}
