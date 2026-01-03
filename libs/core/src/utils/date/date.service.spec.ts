import { DateService } from './date.service';

describe('DateService', () => {
  let service: DateService;

  beforeEach(() => {
    service = new DateService();
  });

  describe('getNow', () => {
    it('should return current date', () => {
      const before = new Date();
      const result = service.getNow();
      const after = new Date();

      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should return a new date instance each time', () => {
      const date1 = service.getNow();
      const date2 = service.getNow();

      expect(date1).not.toBe(date2);
    });
  });

  describe('parseIso', () => {
    it('should parse ISO 8601 string to Date', () => {
      const isoString = '2024-01-15T10:30:00.000Z';
      const result = service.parseIso(isoString);

      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe(isoString);
    });

    it('should parse date-only ISO string', () => {
      const isoString = '2024-01-15';
      const result = service.parseIso(isoString);

      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(0); // January is 0
      expect(result.getDate()).toBe(15);
    });

    it('should parse ISO string with timezone offset', () => {
      const isoString = '2024-01-15T10:30:00+05:00';
      const result = service.parseIso(isoString);

      expect(result).toBeInstanceOf(Date);
    });

    it('should handle various ISO formats', () => {
      const testCases = ['2024-01-15T10:30:00.000Z', '2024-01-15T10:30:00Z', '2024-01-15'];

      testCases.forEach((isoString) => {
        const result = service.parseIso(isoString);
        expect(result).toBeInstanceOf(Date);
        expect(isNaN(result.getTime())).toBe(false);
      });
    });
  });

  describe('toIso', () => {
    it('should convert Date to ISO 8601 string', () => {
      const date = new Date('2024-01-15T10:30:00.000Z');
      const result = service.toIso(date);

      expect(result).toBe('2024-01-15T10:30:00.000Z');
    });

    it('should produce valid ISO string format', () => {
      const date = new Date('2024-12-25T23:59:59.999Z');
      const result = service.toIso(date);

      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(result).toBe('2024-12-25T23:59:59.999Z');
    });

    it('should handle dates at start of epoch', () => {
      const date = new Date('1970-01-01T00:00:00.000Z');
      const result = service.toIso(date);

      expect(result).toBe('1970-01-01T00:00:00.000Z');
    });

    it('should handle dates in the future', () => {
      const date = new Date('2099-12-31T23:59:59.999Z');
      const result = service.toIso(date);

      expect(result).toBe('2099-12-31T23:59:59.999Z');
    });

    it('should round-trip through parseIso and toIso', () => {
      const originalIso = '2024-01-15T10:30:00.000Z';
      const date = service.parseIso(originalIso);
      const result = service.toIso(date);

      expect(result).toBe(originalIso);
    });
  });
});
