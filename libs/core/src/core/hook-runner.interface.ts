import { DismissibleItemDto } from '@dismissible/nestjs-item';
import { IRequestContext } from '@dismissible/nestjs-request';
import { IHookRunResult } from './hook-runner.service';

/**
 * Injection token for the hook runner provider.
 */
export const DISMISSIBLE_HOOK_RUNNER = Symbol('DISMISSIBLE_HOOK_RUNNER');

/**
 * Interface for hook runner providers.
 * Service responsible for running lifecycle hooks.
 */
export interface IHookRunner {
  /**
   * Run pre-request hooks (global - runs at start of any operation).
   * Use for authentication, rate limiting, request validation.
   */
  runPreRequest(itemId: string, userId: string, context?: IRequestContext): Promise<IHookRunResult>;

  /**
   * Run post-request hooks (global - runs at end of any operation).
   * Use for audit logging, metrics, cleanup.
   */
  runPostRequest(
    itemId: string,
    item: DismissibleItemDto,
    userId: string,
    context?: IRequestContext,
  ): Promise<void>;

  /**
   * Run pre-get hooks (when item exists and is about to be returned).
   * Receives the item for access control based on item state.
   */
  runPreGet(
    itemId: string,
    item: DismissibleItemDto,
    userId: string,
    context?: IRequestContext,
  ): Promise<IHookRunResult>;

  /**
   * Run post-get hooks (after item is returned).
   */
  runPostGet(
    itemId: string,
    item: DismissibleItemDto,
    userId: string,
    context?: IRequestContext,
  ): Promise<void>;

  /**
   * Run pre-create hooks.
   */
  runPreCreate(itemId: string, userId: string, context?: IRequestContext): Promise<IHookRunResult>;

  /**
   * Run post-create hooks.
   */
  runPostCreate(
    itemId: string,
    item: DismissibleItemDto,
    userId: string,
    context?: IRequestContext,
  ): Promise<void>;

  /**
   * Run pre-dismiss hooks.
   */
  runPreDismiss(itemId: string, userId: string, context?: IRequestContext): Promise<IHookRunResult>;

  /**
   * Run post-dismiss hooks.
   */
  runPostDismiss(
    itemId: string,
    item: DismissibleItemDto,
    userId: string,
    context?: IRequestContext,
  ): Promise<void>;

  /**
   * Run pre-restore hooks.
   */
  runPreRestore(itemId: string, userId: string, context?: IRequestContext): Promise<IHookRunResult>;

  /**
   * Run post-restore hooks.
   */
  runPostRestore(
    itemId: string,
    item: DismissibleItemDto,
    userId: string,
    context?: IRequestContext,
  ): Promise<void>;
}
