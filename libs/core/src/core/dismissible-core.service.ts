import { Injectable, Inject } from '@nestjs/common';
import { DISMISSIBLE_STORAGE_ADAPTER, IDismissibleStorage } from '@dismissible/nestjs-storage';
import {
  IGetOrCreateServiceResponse,
  IDismissServiceResponse,
  IRestoreServiceResponse,
} from './service-responses.interface';
import { IDismissibleCoreService } from './dismissible-core.service.interface';
import { IDismissibleHelper, DISMISSIBLE_HELPER } from '../utils/dismissible.helper.interface';
import { IDateService, DISMISSIBLE_DATE_SERVICE } from '../utils/date/date.service.interface';
import { DISMISSIBLE_LOGGER, IDismissibleLogger } from '@dismissible/nestjs-logger';
import {
  ItemNotFoundException,
  ItemAlreadyDismissedException,
  ItemNotDismissedException,
} from '../exceptions';
import { IValidationService, DISMISSIBLE_VALIDATION_SERVICE } from '@dismissible/nestjs-validation';
import {
  DismissibleItemDto,
  IDismissibleItemFactory,
  DISMISSIBLE_ITEM_FACTORY,
} from '@dismissible/nestjs-item';

/**
 * Core business logic service for dismissible operations.
 * Handles pure CRUD operations without side effects (hooks, events).
 */
@Injectable()
export class DismissibleCoreService implements IDismissibleCoreService {
  constructor(
    @Inject(DISMISSIBLE_STORAGE_ADAPTER) private readonly storage: IDismissibleStorage,
    @Inject(DISMISSIBLE_DATE_SERVICE) private readonly dateService: IDateService,
    @Inject(DISMISSIBLE_LOGGER) private readonly logger: IDismissibleLogger,
    @Inject(DISMISSIBLE_ITEM_FACTORY) private readonly itemFactory: IDismissibleItemFactory,
    @Inject(DISMISSIBLE_VALIDATION_SERVICE)
    private readonly validationService: IValidationService,
    @Inject(DISMISSIBLE_HELPER) private readonly dismissibleHelper: IDismissibleHelper,
  ) {}

  /**
   * Get an existing item by user ID and item ID.
   * @param itemId The item identifier
   * @param userId The user identifier (required)
   * @returns The item or null if not found
   */
  async get(itemId: string, userId: string): Promise<DismissibleItemDto | null> {
    this.logger.debug(`Looking up item in storage`, { itemId, userId });
    const item = await this.storage.get(userId, itemId);
    if (item) {
      this.logger.debug(`Found existing item`, { itemId, userId });
    }
    return item;
  }

  /**
   * Create a new item.
   * @param itemId The item identifier
   * @param userId The user identifier (required)
   * @returns The created item
   */
  async create(itemId: string, userId: string): Promise<DismissibleItemDto> {
    this.logger.debug(`Creating new item`, {
      itemId,
      userId,
    });

    const now = this.dateService.getNow();
    const newItem = this.itemFactory.create({
      id: itemId,
      createdAt: now,
      userId,
    });

    await this.validationService.validateInstance(newItem);

    const createdItem = await this.storage.create(newItem);

    this.logger.log(`Created new dismissible item`, { itemId, userId });

    return createdItem;
  }

  /**
   * Get an existing item or create a new one.
   * @param itemId The item identifier
   * @param userId The user identifier (required)
   */
  async getOrCreate(itemId: string, userId: string): Promise<IGetOrCreateServiceResponse> {
    const existingItem = await this.get(itemId, userId);

    if (existingItem) {
      return {
        item: existingItem,
        created: false,
      };
    }

    const createdItem = await this.create(itemId, userId);

    return {
      item: createdItem,
      created: true,
    };
  }

  /**
   * Dismiss an item.
   * @param itemId The item identifier
   * @param userId The user identifier (required)
   * @throws ItemNotFoundException if item doesn't exist
   * @throws ItemAlreadyDismissedException if item is already dismissed
   */
  async dismiss(itemId: string, userId: string): Promise<IDismissServiceResponse> {
    this.logger.debug(`Attempting to dismiss item`, { itemId, userId });

    const existingItem = await this.storage.get(userId, itemId);

    if (!existingItem) {
      this.logger.warn(`Cannot dismiss: item not found`, { itemId, userId });
      throw new ItemNotFoundException(itemId);
    }

    if (this.dismissibleHelper.isDismissed(existingItem)) {
      this.logger.warn(`Cannot dismiss: item already dismissed`, { itemId, userId });
      throw new ItemAlreadyDismissedException(itemId);
    }

    const previousItem = this.itemFactory.clone(existingItem);
    const dismissedItem = this.itemFactory.createDismissed(existingItem, this.dateService.getNow());

    await this.validationService.validateInstance(dismissedItem);

    const updatedItem = await this.storage.update(dismissedItem);

    this.logger.log(`Item dismissed`, { itemId, userId });

    return {
      item: updatedItem,
      previousItem,
    };
  }

  /**
   * Restore a dismissed item.
   * @param itemId The item identifier
   * @param userId The user identifier (required)
   * @throws ItemNotFoundException if item doesn't exist
   * @throws ItemNotDismissedException if item is not dismissed
   */
  async restore(itemId: string, userId: string): Promise<IRestoreServiceResponse> {
    this.logger.debug(`Attempting to restore item`, { itemId, userId });

    const existingItem = await this.storage.get(userId, itemId);

    if (!existingItem) {
      this.logger.warn(`Cannot restore: item not found`, { itemId, userId });
      throw new ItemNotFoundException(itemId);
    }

    if (!this.dismissibleHelper.isDismissed(existingItem)) {
      this.logger.warn(`Cannot restore: item not dismissed`, { itemId, userId });
      throw new ItemNotDismissedException(itemId);
    }

    const previousItem = this.itemFactory.clone(existingItem);
    const restoredItem = this.itemFactory.createRestored(existingItem);

    await this.validationService.validateInstance(restoredItem);

    const updatedItem = await this.storage.update(restoredItem);

    this.logger.log(`Item restored`, { itemId, userId });

    return {
      item: updatedItem,
      previousItem,
    };
  }
}
