import { Param } from '@nestjs/common';
import { ParamValidationPipe } from './param-validation.pipe';

/**
 * Custom parameter decorator for userId.
 * Combines @Param('userId') with ParamValidationPipe for validation.
 *
 * @example
 * ```typescript
 * @Get(':itemId')
 * async getOrCreate(
 *   @UserId() userId: string,
 *   @ItemId() itemId: string,
 * )
 * ```
 */
export const UserId = () => Param('userId', ParamValidationPipe);

/**
 * Custom parameter decorator for itemId.
 * Combines @Param('itemId') with ParamValidationPipe for validation.
 *
 * @example
 * ```typescript
 * @Get(':itemId')
 * async getOrCreate(
 *   @UserId() userId: string,
 *   @ItemId() itemId: string,
 * )
 * ```
 */
export const ItemId = () => Param('itemId', ParamValidationPipe);
