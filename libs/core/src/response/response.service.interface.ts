import { HttpException } from '@nestjs/common';
import { IErrorResponseDto, ISuccessResponseDto } from './dtos';

/**
 * Injection token for the response service provider.
 */
export const DISMISSIBLE_RESPONSE_SERVICE = Symbol('DISMISSIBLE_RESPONSE_SERVICE');

/**
 * Interface for response service providers.
 */
export interface IResponseService {
  /**
   * Create a success response.
   */
  success<T>(data: T): ISuccessResponseDto<T>;

  /**
   * Create an error response.
   */
  error(error: HttpException): IErrorResponseDto;
}
