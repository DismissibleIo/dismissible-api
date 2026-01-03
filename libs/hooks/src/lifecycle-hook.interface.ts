import { DismissibleItemDto } from '@dismissible/nestjs-item';
import { IRequestContext } from '@dismissible/nestjs-request';

/**
 * Injection token for lifecycle hooks.
 */
export const DISMISSIBLE_HOOKS = Symbol('DISMISSIBLE_HOOKS');

/**
 * Mutations that can be applied by pre-hooks.
 */
export interface IHookMutations {
  /** Mutated item ID */
  id?: string;

  /** Mutated user ID */
  userId?: string;

  /** Mutated request context */
  context?: Partial<IRequestContext>;
}

/**
 * Result returned by pre-hooks.
 */
export interface IHookResult {
  /** Whether the operation should proceed */
  proceed: boolean;

  /** Optional reason if the operation is blocked */
  reason?: string;

  /** Optional mutations to apply */
  mutations?: IHookMutations;
}

/**
 * Interface for lifecycle hooks that can intercept dismissible operations.
 */
export interface IDismissibleLifecycleHook {
  /**
   * Priority for hook execution (lower numbers run first).
   * Default is 0.
   */
  readonly priority?: number;

  /**
   * Called at the start of any operation (getOrCreate, dismiss, restore).
   * Use for global concerns like authentication, rate limiting, request validation.
   */
  onBeforeRequest?(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IHookResult> | IHookResult;

  /**
   * Called at the end of any operation (getOrCreate, dismiss, restore).
   * Use for global concerns like audit logging, metrics, cleanup.
   */
  onAfterRequest?(
    itemId: string,
    item: DismissibleItemDto,
    userId: string,
    context?: IRequestContext,
  ): Promise<void> | void;

  /**
   * Called before returning an existing item.
   * Only called when item exists in storage.
   * Use for access control based on item state (e.g., block dismissed items).
   */
  onBeforeGet?(
    itemId: string,
    item: DismissibleItemDto,
    userId: string,
    context?: IRequestContext,
  ): Promise<IHookResult> | IHookResult;

  /**
   * Called after returning an existing item.
   * Only called when item exists in storage.
   */
  onAfterGet?(
    itemId: string,
    item: DismissibleItemDto,
    userId: string,
    context?: IRequestContext,
  ): Promise<void> | void;

  /**
   * Called before creating a new item.
   * Use for plan limits, quota checks, etc.
   */
  onBeforeCreate?(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IHookResult> | IHookResult;

  /**
   * Called after creating a new item.
   */
  onAfterCreate?(
    itemId: string,
    item: DismissibleItemDto,
    userId: string,
    context?: IRequestContext,
  ): Promise<void> | void;

  /**
   * Called before dismissing an item.
   */
  onBeforeDismiss?(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IHookResult> | IHookResult;

  /**
   * Called after dismissing an item.
   */
  onAfterDismiss?(
    itemId: string,
    item: DismissibleItemDto,
    userId: string,
    context?: IRequestContext,
  ): Promise<void> | void;

  /**
   * Called before restoring an item.
   */
  onBeforeRestore?(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IHookResult> | IHookResult;

  /**
   * Called after restoring an item.
   */
  onAfterRestore?(
    itemId: string,
    item: DismissibleItemDto,
    userId: string,
    context?: IRequestContext,
  ): Promise<void> | void;
}
