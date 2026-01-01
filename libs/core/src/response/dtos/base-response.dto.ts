import { ApiProperty } from '@nestjs/swagger';

/**
 * Base response DTO that wraps all successful API responses
 */
export class BaseResponseDto<T> {
  @ApiProperty({
    description: 'Response data',
  })
  data: T;
}
