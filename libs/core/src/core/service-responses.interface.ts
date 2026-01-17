import { DismissibleItemDto } from '@dismissible/nestjs-item';

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
 * Response from batchGetOrCreate operation.
 */
export interface IBatchGetOrCreateServiceResponse {
  /** All items (both retrieved and created) */
  items: DismissibleItemDto[];

  /** Items that were retrieved from storage */
  retrievedItems: DismissibleItemDto[];

  /** Items that were newly created */
  createdItems: DismissibleItemDto[];
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
