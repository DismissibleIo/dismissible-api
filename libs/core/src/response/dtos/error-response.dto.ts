import { ApiProperty } from '@nestjs/swagger';

export type IErrorResponseDto = {
  error: {
    message: string;
    code: number;
  };
};

/**
 * DTO representing error details in API responses
 */
export class ErrorDetailsDto {
  @ApiProperty({
    description: 'Error message',
    example: 'Item not found',
  })
  message: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 404,
  })
  code: number;
}

/**
 * DTO for error responses
 */
export class ErrorResponseDto implements IErrorResponseDto {
  @ApiProperty({
    description: 'Error details',
    type: ErrorDetailsDto,
  })
  error: ErrorDetailsDto;
}
