import { Injectable } from '@nestjs/common';
import { IDateService } from './date.service.interface';

/**
 * Service for date operations.
 */
@Injectable()
export class DateService implements IDateService {
  getNow(): Date {
    return new Date();
  }

  parseIso(isoString: string): Date {
    return new Date(isoString);
  }

  toIso(date: Date): string {
    return date.toISOString();
  }
}
