import { PipeTransform, Injectable, BadRequestException, ArgumentMetadata } from '@nestjs/common';
import { VALIDATION_CONSTANTS } from '../../validation/dismissible-input.dto';

/**
 * Validation pipe for userId and itemId route parameters.
 * Validates:
 * - Required (non-empty)
 * - Length between 1-64 characters
 * - Contains only alphanumeric characters, dashes, and underscores
 */
@Injectable()
export class ParamValidationPipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    const paramName = metadata.data || 'parameter';

    if (!value || value.trim() === '') {
      throw new BadRequestException(`${paramName} is required`);
    }

    if (value.length < VALIDATION_CONSTANTS.ID_MIN_LENGTH) {
      throw new BadRequestException(
        `${paramName} must be at least ${VALIDATION_CONSTANTS.ID_MIN_LENGTH} character`,
      );
    }

    if (value.length > VALIDATION_CONSTANTS.ID_MAX_LENGTH) {
      throw new BadRequestException(
        `${paramName} must be at most ${VALIDATION_CONSTANTS.ID_MAX_LENGTH} characters`,
      );
    }

    if (!VALIDATION_CONSTANTS.ID_PATTERN.test(value)) {
      throw new BadRequestException(`${paramName} ${VALIDATION_CONSTANTS.ID_PATTERN_MESSAGE}`);
    }

    return value;
  }
}
