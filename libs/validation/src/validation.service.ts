import { Injectable, BadRequestException } from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance, ClassConstructor } from 'class-transformer';
import { IValidationService } from './validation.service.interface';

@Injectable()
export class ValidationService implements IValidationService {
  async validateDto<T extends object>(dtoClass: ClassConstructor<T>, data: unknown): Promise<T> {
    if (data === null || data === undefined) {
      throw new BadRequestException('Data cannot be null or undefined');
    }

    const dtoInstance = plainToInstance(dtoClass, data);
    const validationErrors = await validate(dtoInstance as object);

    if (validationErrors.length > 0) {
      const errorMessages = this.formatValidationErrors(validationErrors);
      throw new BadRequestException(errorMessages);
    }

    return dtoInstance;
  }

  async validateInstance<T extends object>(instance: T): Promise<void> {
    const validationErrors = await validate(instance as object);

    if (validationErrors.length > 0) {
      const errorMessages = this.formatValidationErrors(validationErrors);
      throw new BadRequestException(errorMessages);
    }
  }

  private formatValidationErrors(errors: ValidationError[]): string {
    return errors
      .map((error) => this.extractErrorMessage(error))
      .filter((message) => message.length > 0)
      .join('; ');
  }

  private extractErrorMessage(error: ValidationError): string {
    const messages: string[] = [];

    if (error.constraints) {
      messages.push(...Object.values(error.constraints));
    }

    if (error.children && error.children.length > 0) {
      const childMessages = error.children
        .map((child) => this.extractErrorMessage(child))
        .filter((message) => message.length > 0);
      messages.push(...childMessages);
    }

    return messages.join(', ');
  }
}
