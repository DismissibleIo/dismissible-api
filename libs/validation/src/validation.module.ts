import { Module } from '@nestjs/common';
import { ValidationService } from './validation.service';
import { DISMISSIBLE_VALIDATION_SERVICE } from './validation.service.interface';

@Module({
  providers: [
    ValidationService,
    { provide: DISMISSIBLE_VALIDATION_SERVICE, useExisting: ValidationService },
  ],
  exports: [ValidationService, DISMISSIBLE_VALIDATION_SERVICE],
})
export class ValidationModule {}
