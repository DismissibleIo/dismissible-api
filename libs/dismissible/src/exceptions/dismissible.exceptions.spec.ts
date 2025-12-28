import { HttpStatus } from '@nestjs/common';
import {
  ItemNotFoundException,
  ItemAlreadyDismissedException,
  ItemNotDismissedException,
} from './dismissible.exceptions';

describe('Dismissible Exceptions', () => {
  describe('ItemNotFoundException', () => {
    it('should create exception with correct structure', () => {
      const exception = new ItemNotFoundException('test-item');

      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);

      const response = exception.getResponse() as any;
      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(response.code).toBe('ITEM_NOT_FOUND');
      expect(response.message).toContain('test-item');
      expect(response.itemId).toBe('test-item');
    });
  });

  describe('ItemAlreadyDismissedException', () => {
    it('should create exception with correct structure', () => {
      const exception = new ItemAlreadyDismissedException('test-item');

      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);

      const response = exception.getResponse() as any;
      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(response.code).toBe('ITEM_ALREADY_DISMISSED');
      expect(response.message).toContain('test-item');
      expect(response.itemId).toBe('test-item');
    });
  });

  describe('ItemNotDismissedException', () => {
    it('should create exception with correct structure', () => {
      const exception = new ItemNotDismissedException('test-item');

      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);

      const response = exception.getResponse() as any;
      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(response.code).toBe('ITEM_NOT_DISMISSED');
      expect(response.message).toContain('test-item');
      expect(response.itemId).toBe('test-item');
    });
  });
});
