import { ResponseService } from './response.service';
import { NotFoundException } from '@nestjs/common';

describe('ResponseService', () => {
  let service: ResponseService;

  beforeEach(() => {
    service = new ResponseService();
  });

  describe('success', () => {
    it('should return a success response with the provided data', () => {
      const testData = { id: '123', name: 'Test Item' };

      const result = service.success(testData);

      expect(result).toEqual({
        data: testData,
      });
    });

    it('should work with primitive data types', () => {
      const testString = 'Test String';

      const result = service.success(testString);

      expect(result).toEqual({
        data: testString,
      });
    });

    it('should work with array data', () => {
      const testArray = [1, 2, 3];

      const result = service.success(testArray);

      expect(result).toEqual({
        data: testArray,
      });
    });

    it('should handle null data', () => {
      const result = service.success(null);

      expect(result).toEqual({
        data: null,
      });
    });

    it('should handle undefined data', () => {
      const result = service.success(undefined);

      expect(result).toEqual({
        data: undefined,
      });
    });
  });

  describe('error', () => {
    it('should return an error response with the provided message', () => {
      const errorMessage = new NotFoundException('Not found');
      const result = service.error(errorMessage);

      expect(result).toEqual({
        error: {
          message: 'Not found',
          code: 404,
        },
      });
    });
  });
});
