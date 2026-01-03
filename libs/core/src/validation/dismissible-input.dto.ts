import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

/**
 * Validation constants for dismissible input fields.
 */
export const VALIDATION_CONSTANTS = {
  /** Maximum length for userId and itemId */
  ID_MAX_LENGTH: 64,
  /** Minimum length for userId and itemId */
  ID_MIN_LENGTH: 1,
  /** Pattern for valid userId and itemId (alphanumeric, dash, underscore) */
  ID_PATTERN: /^[a-zA-Z0-9_-]+$/,
  /** Human-readable description of the ID pattern */
  ID_PATTERN_MESSAGE: 'must contain only alphanumeric characters, dashes, and underscores',
} as const;

/**
 * DTO for validating dismissible input parameters (userId and itemId).
 * Used at both controller and service layers for defense in depth.
 */
export class DismissibleInputDto {
  @IsString()
  @IsNotEmpty({ message: 'itemId is required' })
  @MinLength(VALIDATION_CONSTANTS.ID_MIN_LENGTH, {
    message: `itemId must be at least ${VALIDATION_CONSTANTS.ID_MIN_LENGTH} character`,
  })
  @MaxLength(VALIDATION_CONSTANTS.ID_MAX_LENGTH, {
    message: `itemId must be at most ${VALIDATION_CONSTANTS.ID_MAX_LENGTH} characters`,
  })
  @Matches(VALIDATION_CONSTANTS.ID_PATTERN, {
    message: `itemId ${VALIDATION_CONSTANTS.ID_PATTERN_MESSAGE}`,
  })
  itemId: string;

  @IsString()
  @IsNotEmpty({ message: 'userId is required' })
  @MinLength(VALIDATION_CONSTANTS.ID_MIN_LENGTH, {
    message: `userId must be at least ${VALIDATION_CONSTANTS.ID_MIN_LENGTH} character`,
  })
  @MaxLength(VALIDATION_CONSTANTS.ID_MAX_LENGTH, {
    message: `userId must be at most ${VALIDATION_CONSTANTS.ID_MAX_LENGTH} characters`,
  })
  @Matches(VALIDATION_CONSTANTS.ID_PATTERN, {
    message: `userId ${VALIDATION_CONSTANTS.ID_PATTERN_MESSAGE}`,
  })
  userId: string;
}
