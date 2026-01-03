import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Error response structure for dismissible exceptions.
 */
interface IDismissibleErrorResponse {
  statusCode: number;
  error: string;
  code: string;
  message: string;
  itemId?: string;
}

/**
 * Base exception class for dismissible errors.
 */
abstract class DismissibleException extends HttpException {
  constructor(message: string, code: string, statusCode: HttpStatus, itemId?: string) {
    const response: IDismissibleErrorResponse = {
      statusCode,
      error: HttpStatus[statusCode].replace(/_/g, ' '),
      code,
      message,
    };

    if (itemId) {
      response.itemId = itemId;
    }

    super(response, statusCode);
  }
}

/**
 * Exception thrown when an item is not found.
 */
export class ItemNotFoundException extends DismissibleException {
  constructor(itemId: string) {
    super(`Item with id "${itemId}" not found`, 'ITEM_NOT_FOUND', HttpStatus.BAD_REQUEST, itemId);
  }
}

/**
 * Exception thrown when trying to dismiss an already dismissed item.
 */
export class ItemAlreadyDismissedException extends DismissibleException {
  constructor(itemId: string) {
    super(
      `Item with id "${itemId}" is already dismissed`,
      'ITEM_ALREADY_DISMISSED',
      HttpStatus.BAD_REQUEST,
      itemId,
    );
  }
}

/**
 * Exception thrown when trying to restore an item that is not dismissed.
 */
export class ItemNotDismissedException extends DismissibleException {
  constructor(itemId: string) {
    super(
      `Item with id "${itemId}" is not dismissed`,
      'ITEM_NOT_DISMISSED',
      HttpStatus.BAD_REQUEST,
      itemId,
    );
  }
}
