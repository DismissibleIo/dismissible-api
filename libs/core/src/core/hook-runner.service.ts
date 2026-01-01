import { Injectable, Inject, Optional, ForbiddenException } from '@nestjs/common';
import {
  DISMISSIBLE_HOOKS,
  IDismissibleLifecycleHook,
  IHookResult,
} from '@dismissible/nestjs-hooks';
import { DISMISSIBLE_LOGGER, IDismissibleLogger } from '@dismissible/nestjs-logger';
import { DismissibleItemDto } from '@dismissible/nestjs-item';
import { IRequestContext } from '@dismissible/nestjs-request';

/**
 * Result from running pre-hooks.
 */
export interface IHookRunResult {
  /** Whether the operation should proceed */
  proceed: boolean;

  /** The (potentially mutated) item ID */
  id: string;

  /** The (potentially mutated) user ID */
  userId: string;

  /** The (potentially mutated) request context */
  context?: IRequestContext;

  /** Reason for blocking (if proceed is false) */
  reason?: string;
}

/**
 * Service responsible for running lifecycle hooks.
 */
@Injectable()
export class HookRunner {
  private readonly sortedHooks: IDismissibleLifecycleHook[];

  constructor(
    @Optional()
    @Inject(DISMISSIBLE_HOOKS)
    hooks: IDismissibleLifecycleHook[] = [],
    @Inject(DISMISSIBLE_LOGGER)
    private readonly logger: IDismissibleLogger,
  ) {
    this.sortedHooks = [...hooks].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
  }

  /**
   * Run pre-request hooks (global - runs at start of any operation).
   * Use for authentication, rate limiting, request validation.
   */
  async runPreRequest(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IHookRunResult> {
    return this.runPreHooks('onBeforeRequest', itemId, userId, context);
  }

  /**
   * Run post-request hooks (global - runs at end of any operation).
   * Use for audit logging, metrics, cleanup.
   */
  async runPostRequest(
    itemId: string,
    item: DismissibleItemDto,
    userId: string,
    context?: IRequestContext,
  ): Promise<void> {
    await this.runPostHooks('onAfterRequest', itemId, item, userId, context);
  }

  /**
   * Run pre-get hooks (when item exists and is about to be returned).
   * Receives the item for access control based on item state.
   */
  async runPreGet(
    itemId: string,
    item: DismissibleItemDto,
    userId: string,
    context?: IRequestContext,
  ): Promise<IHookRunResult> {
    return this.runPreHooksWithItem('onBeforeGet', itemId, item, userId, context);
  }

  /**
   * Run post-get hooks (after item is returned).
   */
  async runPostGet(
    itemId: string,
    item: DismissibleItemDto,
    userId: string,
    context?: IRequestContext,
  ): Promise<void> {
    await this.runPostHooks('onAfterGet', itemId, item, userId, context);
  }

  /**
   * Run pre-create hooks.
   */
  async runPreCreate(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IHookRunResult> {
    return this.runPreHooks('onBeforeCreate', itemId, userId, context);
  }

  /**
   * Run post-create hooks.
   */
  async runPostCreate(
    itemId: string,
    item: DismissibleItemDto,
    userId: string,
    context?: IRequestContext,
  ): Promise<void> {
    await this.runPostHooks('onAfterCreate', itemId, item, userId, context);
  }

  /**
   * Run pre-dismiss hooks.
   */
  async runPreDismiss(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IHookRunResult> {
    return this.runPreHooks('onBeforeDismiss', itemId, userId, context);
  }

  /**
   * Run post-dismiss hooks.
   */
  async runPostDismiss(
    itemId: string,
    item: DismissibleItemDto,
    userId: string,
    context?: IRequestContext,
  ): Promise<void> {
    await this.runPostHooks('onAfterDismiss', itemId, item, userId, context);
  }

  /**
   * Run pre-restore hooks.
   */
  async runPreRestore(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IHookRunResult> {
    return this.runPreHooks('onBeforeRestore', itemId, userId, context);
  }

  /**
   * Run post-restore hooks.
   */
  async runPostRestore(
    itemId: string,
    item: DismissibleItemDto,
    userId: string,
    context?: IRequestContext,
  ): Promise<void> {
    await this.runPostHooks('onAfterRestore', itemId, item, userId, context);
  }

  /**
   * Internal method to run pre-hooks.
   */
  private async runPreHooks(
    hookName: keyof IDismissibleLifecycleHook,
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IHookRunResult> {
    let currentId = itemId;
    let currentUserId = userId;
    let currentContext = context ? { ...context } : undefined;

    for (const hook of this.sortedHooks) {
      const hookFn = hook[hookName] as
        | ((
            itemId: string,
            userId: string,
            context?: IRequestContext,
          ) => Promise<IHookResult> | IHookResult)
        | undefined;

      if (hookFn) {
        try {
          const result = await hookFn.call(hook, currentId, currentUserId, currentContext);

          if (!result.proceed) {
            this.logger.debug(`Hook ${hook.constructor.name}.${hookName} blocked operation`, {
              itemId: currentId,
              userId: currentUserId,
              reason: result.reason,
            });

            return {
              proceed: false,
              id: currentId,
              userId: currentUserId,
              context: currentContext,
              reason: result.reason,
            };
          }

          if (result.mutations) {
            if (result.mutations.id !== undefined) {
              currentId = result.mutations.id;
            }
            if (result.mutations.userId !== undefined) {
              currentUserId = result.mutations.userId;
            }
            if (result.mutations.context && currentContext) {
              currentContext = { ...currentContext, ...result.mutations.context };
            }
          }
        } catch (error) {
          this.logger.error(
            `Error in hook ${hook.constructor.name}.${hookName}`,
            error instanceof Error ? error : new Error(String(error)),
            {
              itemId: currentId,
              userId: currentUserId,
            },
          );
          throw error;
        }
      }
    }

    return {
      proceed: true,
      id: currentId,
      userId: currentUserId,
      context: currentContext,
    };
  }

  /**
   * Internal method to run pre-hooks that receive the item (e.g., onBeforeGet).
   * Unlike standard pre-hooks, these receive the item for inspection/access control.
   */
  private async runPreHooksWithItem(
    hookName: keyof IDismissibleLifecycleHook,
    itemId: string,
    item: DismissibleItemDto,
    userId: string,
    context?: IRequestContext,
  ): Promise<IHookRunResult> {
    let currentId = itemId;
    let currentUserId = userId;
    let currentContext = context ? { ...context } : undefined;

    for (const hook of this.sortedHooks) {
      const hookFn = hook[hookName] as
        | ((
            itemId: string,
            item: DismissibleItemDto,
            userId: string,
            context?: IRequestContext,
          ) => Promise<IHookResult> | IHookResult)
        | undefined;

      if (hookFn) {
        try {
          const result = await hookFn.call(hook, currentId, item, currentUserId, currentContext);

          if (!result.proceed) {
            this.logger.debug(`Hook ${hook.constructor.name}.${hookName} blocked operation`, {
              itemId: currentId,
              userId: currentUserId,
              reason: result.reason,
            });

            return {
              proceed: false,
              id: currentId,
              userId: currentUserId,
              context: currentContext,
              reason: result.reason,
            };
          }

          if (result.mutations) {
            if (result.mutations.id !== undefined) {
              currentId = result.mutations.id;
            }
            if (result.mutations.userId !== undefined) {
              currentUserId = result.mutations.userId;
            }
            if (result.mutations.context && currentContext) {
              currentContext = { ...currentContext, ...result.mutations.context };
            }
          }
        } catch (error) {
          this.logger.error(
            `Error in hook ${hook.constructor.name}.${hookName}`,
            error instanceof Error ? error : new Error(String(error)),
            {
              itemId: currentId,
              userId: currentUserId,
            },
          );
          throw error;
        }
      }
    }

    return {
      proceed: true,
      id: currentId,
      userId: currentUserId,
      context: currentContext,
    };
  }

  /**
   * Internal method to run post-hooks.
   * Post-hooks run in reverse priority order.
   */
  private async runPostHooks(
    hookName: keyof IDismissibleLifecycleHook,
    itemId: string,
    item: DismissibleItemDto,
    userId: string,
    context?: IRequestContext,
  ): Promise<void> {
    const reversedHooks = [...this.sortedHooks].reverse();

    for (const hook of reversedHooks) {
      const hookFn = hook[hookName] as
        | ((
            itemId: string,
            item: DismissibleItemDto,
            userId: string,
            context?: IRequestContext,
          ) => Promise<void> | void)
        | undefined;

      if (hookFn) {
        try {
          await hookFn.call(hook, itemId, item, userId, context);
        } catch (error) {
          this.logger.error(
            `Error in hook ${hook.constructor.name}.${hookName}`,
            error instanceof Error ? error : new Error(String(error)),
            {
              itemId,
              userId,
            },
          );
        }
      }
    }
  }

  /**
   * Throw ForbiddenException if the hook result indicates the operation was blocked.
   */
  static throwIfBlocked(result: IHookRunResult): void {
    if (!result.proceed) {
      throw new ForbiddenException(result.reason ?? 'Operation blocked by lifecycle hook');
    }
  }
}
