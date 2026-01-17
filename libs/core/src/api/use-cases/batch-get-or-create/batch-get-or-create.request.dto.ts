import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsString,
  IsNotEmpty,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { VALIDATION_CONSTANTS } from '../../../validation/dismissible-input.dto';

/**
 * Maximum number of items allowed in a batch request.
 */
export const BATCH_MAX_SIZE = 50;

/**
 * Request DTO for batch get-or-create operation.
 */
export class BatchGetOrCreateRequestDto {
  @ApiProperty({
    description: `Array of item IDs to get or create (max ${BATCH_MAX_SIZE} items)`,
    example: ['welcome-banner-v1', 'onboarding-tip-1', 'feature-announcement'],
    type: [String],
    minItems: 1,
    maxItems: BATCH_MAX_SIZE,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'items array must contain at least 1 item' })
  @ArrayMaxSize(BATCH_MAX_SIZE, {
    message: `items array must contain at most ${BATCH_MAX_SIZE} items`,
  })
  @IsString({ each: true })
  @IsNotEmpty({ each: true, message: 'each item ID must not be empty' })
  @MinLength(VALIDATION_CONSTANTS.ID_MIN_LENGTH, {
    each: true,
    message: `each item ID must be at least ${VALIDATION_CONSTANTS.ID_MIN_LENGTH} character`,
  })
  @MaxLength(VALIDATION_CONSTANTS.ID_MAX_LENGTH, {
    each: true,
    message: `each item ID must be at most ${VALIDATION_CONSTANTS.ID_MAX_LENGTH} characters`,
  })
  @Matches(VALIDATION_CONSTANTS.ID_PATTERN, {
    each: true,
    message: `each item ID ${VALIDATION_CONSTANTS.ID_PATTERN_MESSAGE}`,
  })
  items!: string[];
}
