import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DismissibleCoreService } from './dismissible-core.service';
import { HookRunner } from './hook-runner.service';
import { DISMISSIBLE_LOGGER, IDismissibleLogger } from '@dismissible/nestjs-logger';
import {
  IGetOrCreateServiceResponse,
  IDismissServiceResponse,
  IRestoreServiceResponse,
} from './service-responses.interface';
import { IRequestContext } from '@dismissible/nestjs-request';
import { DismissibleEvents } from '../events';
import {
  ItemCreatedEvent,
  ItemRetrievedEvent,
  ItemDismissedEvent,
  ItemRestoredEvent,
} from '../events';
import { ValidationService } from '@dismissible/nestjs-validation';
import { DismissibleInputDto } from '../validation';

/**
 * Main orchestration service for dismissible operations.
 * Coordinates core logic, hooks, and events.
 */
@Injectable()
export class DismissibleService {
  constructor(
    private readonly coreService: DismissibleCoreService,
    private readonly hookRunner: HookRunner,
    private readonly eventEmitter: EventEmitter2,
    @Inject(DISMISSIBLE_LOGGER)
    private readonly logger: IDismissibleLogger,
    private readonly validationService: ValidationService,
  ) {}

  /**
   * Validates input parameters for all service methods.
   * Provides defense in depth when the service is used directly without controllers.
   */
  private async validateInput(itemId: string, userId: string): Promise<void> {
    await this.validationService.validateDto(DismissibleInputDto, { itemId, userId });
  }

  /**
   * Get an existing item or create a new one.
   * @param itemId The item identifier
   * @param userId The user identifier (required)
   * @param context Optional request context for tracing
   */
  async getOrCreate(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IGetOrCreateServiceResponse> {
    this.logger.debug(`getOrCreate called`, { itemId, userId });

    await this.validateInput(itemId, userId);

    const preResult = await this.hookRunner.runPreRequest(itemId, userId, context);
    HookRunner.throwIfBlocked(preResult);

    const resolvedId = preResult.id;
    const resolvedUserId = preResult.userId;
    const resolvedContext = preResult.context;

    const existingItem = await this.coreService.get(resolvedId, resolvedUserId);

    if (existingItem) {
      const preGetResult = await this.hookRunner.runPreGet(
        resolvedId,
        existingItem,
        resolvedUserId,
        resolvedContext,
      );
      HookRunner.throwIfBlocked(preGetResult);

      this.eventEmitter.emit(
        DismissibleEvents.ITEM_RETRIEVED,
        new ItemRetrievedEvent(resolvedId, existingItem, resolvedUserId, resolvedContext),
      );

      await this.hookRunner.runPostGet(resolvedId, existingItem, resolvedUserId, resolvedContext);

      await this.hookRunner.runPostRequest(
        resolvedId,
        existingItem,
        resolvedUserId,
        resolvedContext,
      );

      this.logger.debug(`getOrCreate completed`, { itemId, created: false });

      return {
        item: existingItem,
        created: false,
      };
    }

    const preCreateResult = await this.hookRunner.runPreCreate(
      resolvedId,
      resolvedUserId,
      resolvedContext,
    );
    HookRunner.throwIfBlocked(preCreateResult);

    const createdItem = await this.coreService.create(resolvedId, resolvedUserId);

    await this.hookRunner.runPostCreate(resolvedId, createdItem, resolvedUserId, resolvedContext);

    this.eventEmitter.emit(
      DismissibleEvents.ITEM_CREATED,
      new ItemCreatedEvent(resolvedId, createdItem, resolvedUserId, resolvedContext),
    );

    await this.hookRunner.runPostRequest(resolvedId, createdItem, resolvedUserId, resolvedContext);

    this.logger.debug(`getOrCreate completed`, { itemId, created: true });

    return {
      item: createdItem,
      created: true,
    };
  }

  /**
   * Dismiss an item.
   * @param itemId The item identifier
   * @param userId The user identifier (required)
   * @param context Optional request context for tracing
   */
  async dismiss(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IDismissServiceResponse> {
    this.logger.debug(`dismiss called`, { itemId, userId });

    await this.validateInput(itemId, userId);

    const preRequestResult = await this.hookRunner.runPreRequest(itemId, userId, context);
    HookRunner.throwIfBlocked(preRequestResult);

    const resolvedId = preRequestResult.id;
    const resolvedUserId = preRequestResult.userId;
    const resolvedContext = preRequestResult.context;

    const preDismissResult = await this.hookRunner.runPreDismiss(
      resolvedId,
      resolvedUserId,
      resolvedContext,
    );
    HookRunner.throwIfBlocked(preDismissResult);

    const result = await this.coreService.dismiss(resolvedId, resolvedUserId);

    await this.hookRunner.runPostDismiss(resolvedId, result.item, resolvedUserId, resolvedContext);

    this.eventEmitter.emit(
      DismissibleEvents.ITEM_DISMISSED,
      new ItemDismissedEvent(
        resolvedId,
        result.item,
        result.previousItem,
        resolvedUserId,
        resolvedContext,
      ),
    );

    await this.hookRunner.runPostRequest(resolvedId, result.item, resolvedUserId, resolvedContext);

    this.logger.debug(`dismiss completed`, { itemId });

    return result;
  }

  /**
   * Restore a dismissed item.
   * @param itemId The item identifier
   * @param userId The user identifier (required)
   * @param context Optional request context for tracing
   */
  async restore(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IRestoreServiceResponse> {
    this.logger.debug(`restore called`, { itemId, userId });

    await this.validateInput(itemId, userId);

    const preRequestResult = await this.hookRunner.runPreRequest(itemId, userId, context);
    HookRunner.throwIfBlocked(preRequestResult);

    const resolvedId = preRequestResult.id;
    const resolvedUserId = preRequestResult.userId;
    const resolvedContext = preRequestResult.context;

    const preRestoreResult = await this.hookRunner.runPreRestore(
      resolvedId,
      resolvedUserId,
      resolvedContext,
    );
    HookRunner.throwIfBlocked(preRestoreResult);

    const result = await this.coreService.restore(resolvedId, resolvedUserId);

    await this.hookRunner.runPostRestore(resolvedId, result.item, resolvedUserId, resolvedContext);

    this.eventEmitter.emit(
      DismissibleEvents.ITEM_RESTORED,
      new ItemRestoredEvent(
        resolvedId,
        result.item,
        result.previousItem,
        resolvedUserId,
        resolvedContext,
      ),
    );

    await this.hookRunner.runPostRequest(resolvedId, result.item, resolvedUserId, resolvedContext);

    this.logger.debug(`restore completed`, { itemId });

    return result;
  }
}
