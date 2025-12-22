import { Injectable } from '@nestjs/common';

/**
 * Service for date operations.
 */
@Injectable()
export class DateService {
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
