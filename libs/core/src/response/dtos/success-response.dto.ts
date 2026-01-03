import { Type } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export type ISuccessResponseDto<T> = {
  data: T;
};

/**
 * Factory function to create a success response DTO wrapper.
 *
 * This allows wrapping any data class in a consistent `{ data: T }` structure
 * with proper Swagger documentation.
 *
 * @example
 * ```ts
 * class UserDto {
 *   @ApiProperty()
 *   id: string;
 *
 *   @ApiProperty()
 *   name: string;
 * }
 *
 * export class GetUserResponseDto extends SuccessResponseDto(UserDto) {}
 * ```
 */
export function SuccessResponseDto<T extends Type>(dataClass: T) {
  class SuccessResponse implements ISuccessResponseDto<T> {
    @ApiProperty({ type: dataClass })
    data!: InstanceType<T>;
  }

  return SuccessResponse;
}
