import { ClassConstructor } from 'class-transformer';

/**
 * Injection token for the validation service provider.
 */
export const DISMISSIBLE_VALIDATION_SERVICE = Symbol('DISMISSIBLE_VALIDATION_SERVICE');

/**
 * Interface for validation service providers.
 */
export interface IValidationService {
  /**
   * Validate data against a DTO class and return the validated instance.
   * @param dtoClass The DTO class to validate against
   * @param data The data to validate
   * @returns The validated DTO instance
   * @throws BadRequestException if validation fails
   */
  validateDto<T extends object>(dtoClass: ClassConstructor<T>, data: unknown): Promise<T>;

  /**
   * Validate an existing instance.
   * @param instance The instance to validate
   * @throws BadRequestException if validation fails
   */
  validateInstance<T extends object>(instance: T): Promise<void>;
}
