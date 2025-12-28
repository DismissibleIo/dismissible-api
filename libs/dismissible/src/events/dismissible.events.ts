import { DismissibleItemDto } from '@dismissible/nestjs-dismissible-item';
import { IRequestContext } from '@dismissible/nestjs-dismissible-request';

/**
 * Base class for all dismissible events.
 */
abstract class BaseDismissibleEvent {
  /** The item identifier */
  readonly id: string;

  /** The current state of the item */
  readonly item: DismissibleItemDto;

  /** The user identifier */
  readonly userId: string;

  /** The request context (optional) */
  readonly context?: IRequestContext;

  constructor(itemId: string, item: DismissibleItemDto, userId: string, context?: IRequestContext) {
    this.id = itemId;
    this.item = item;
    this.userId = userId;
    this.context = context;
  }
}

/**
 * Event emitted when an existing item is retrieved.
 */
export class ItemRetrievedEvent extends BaseDismissibleEvent {
  constructor(itemId: string, item: DismissibleItemDto, userId: string, context?: IRequestContext) {
    super(itemId, item, userId, context);
  }
}

/**
 * Event emitted when a new item is created.
 */
export class ItemCreatedEvent extends BaseDismissibleEvent {
  constructor(itemId: string, item: DismissibleItemDto, userId: string, context?: IRequestContext) {
    super(itemId, item, userId, context);
  }
}

/**
 * Event emitted when an item is dismissed.
 */
export class ItemDismissedEvent extends BaseDismissibleEvent {
  /** The item state before dismissal */
  readonly previousItem: DismissibleItemDto;

  constructor(
    itemId: string,
    item: DismissibleItemDto,
    previousItem: DismissibleItemDto,
    userId: string,
    context?: IRequestContext,
  ) {
    super(itemId, item, userId, context);
    this.previousItem = previousItem;
  }
}

/**
 * Event emitted when a dismissed item is restored.
 */
export class ItemRestoredEvent extends BaseDismissibleEvent {
  /** The item state before restoration */
  readonly previousItem: DismissibleItemDto;

  constructor(
    itemId: string,
    item: DismissibleItemDto,
    previousItem: DismissibleItemDto,
    userId: string,
    context?: IRequestContext,
  ) {
    super(itemId, item, userId, context);
    this.previousItem = previousItem;
  }
}
