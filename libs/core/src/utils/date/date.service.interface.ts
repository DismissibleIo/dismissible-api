/**
 * Injection token for the date service provider.
 */
export const DISMISSIBLE_DATE_SERVICE = Symbol('DISMISSIBLE_DATE_SERVICE');

/**
 * Interface for date service providers.
 */
export interface IDateService {
  /**
   * Get the current date/time.
   */
  getNow(): Date;

  /**
   * Parse an ISO date string.
   */
  parseIso(isoString: string): Date;

  /**
   * Convert a date to ISO string.
   */
  toIso(date: Date): string;
}
