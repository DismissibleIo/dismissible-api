/**
 * Event names for dismissible operations.
 */
export const DismissibleEvents = {
  /** Emitted when an existing item is retrieved */
  ITEM_RETRIEVED: 'dismissible.item.retrieved',

  /** Emitted when a new item is created */
  ITEM_CREATED: 'dismissible.item.created',

  /** Emitted when an item is dismissed */
  ITEM_DISMISSED: 'dismissible.item.dismissed',

  /** Emitted when a dismissed item is restored */
  ITEM_RESTORED: 'dismissible.item.restored',
} as const;

/**
 * Type representing all dismissible event names.
 */
export type DismissibleEventType = (typeof DismissibleEvents)[keyof typeof DismissibleEvents];
