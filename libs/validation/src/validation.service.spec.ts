import { BadRequestException } from '@nestjs/common';
import { ValidationService } from './validation.service';
import { IsString, IsOptional, Length, IsEmail } from 'class-validator';

class TestDto {
  @IsString()
  @Length(1, 10)
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  description?: string;
}

describe('ValidationService', () => {
  let service: ValidationService;

  beforeEach(() => {
    service = new ValidationService();
  });

  describe('validateDto', () => {
    it('should validate a valid DTO successfully', async () => {
      const data = {
        name: 'test',
        email: 'test@example.com',
        description: 'optional field',
      };

      const result = await service.validateDto(TestDto, data);

      expect(result).toBeInstanceOf(TestDto);
      expect(result.name).toBe('test');
      expect(result.email).toBe('test@example.com');
      expect(result.description).toBe('optional field');
    });

    it('should validate a valid DTO with optional fields missing', async () => {
      const data = {
        name: 'test',
        email: 'test@example.com',
      };

      const result = await service.validateDto(TestDto, data);

      expect(result).toBeInstanceOf(TestDto);
      expect(result.name).toBe('test');
      expect(result.email).toBe('test@example.com');
      expect(result.description).toBeUndefined();
    });

    it('should throw BadRequestException for invalid string length', async () => {
      const data = {
        name: 'this name is too long',
        email: 'test@example.com',
      };

      await expect(service.validateDto(TestDto, data)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid email', async () => {
      const data = {
        name: 'test',
        email: 'invalid-email',
      };

      await expect(service.validateDto(TestDto, data)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for missing required fields', async () => {
      const data = {
        name: 'test',
      };

      await expect(service.validateDto(TestDto, data)).rejects.toThrow(BadRequestException);
    });

    it('should combine multiple validation errors', async () => {
      const data = {
        name: 'this name is way too long for validation',
        email: 'invalid-email',
      };

      try {
        await service.validateDto(TestDto, data);
        fail('Should have thrown BadRequestException');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const message = (error as BadRequestException).message;
        expect(message).toContain('name must be shorter than or equal to 10 characters');
        expect(message).toContain('email must be an email');
      }
    });

    it('should handle empty data', async () => {
      const data = {};

      await expect(service.validateDto(TestDto, data)).rejects.toThrow(BadRequestException);
    });

    it('should handle null data', async () => {
      const data = null;

      await expect(service.validateDto(TestDto, data)).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateInstance', () => {
    it('should validate a valid instance successfully', async () => {
      const instance = new TestDto();
      instance.name = 'test';
      instance.email = 'test@example.com';

      await expect(service.validateInstance(instance)).resolves.toBeUndefined();
    });

    it('should throw BadRequestException for invalid instance', async () => {
      const instance = new TestDto();
      instance.name = 'this name is too long';
      instance.email = 'invalid-email';

      await expect(service.validateInstance(instance)).rejects.toThrow(BadRequestException);
    });

    it('should handle instance with missing required fields', async () => {
      const instance = new TestDto();
      instance.name = 'test';

      await expect(service.validateInstance(instance)).rejects.toThrow(BadRequestException);
    });
  });

  describe('error message formatting', () => {
    it('should format single error correctly', async () => {
      const data = {
        name: 'test',
        email: 'invalid-email',
      };

      try {
        await service.validateDto(TestDto, data);
        fail('Should have thrown BadRequestException');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe('email must be an email');
      }
    });

    it('should format multiple errors with semicolon separator', async () => {
      const data = {
        name: '',
        email: 'invalid',
      };

      try {
        await service.validateDto(TestDto, data);
        fail('Should have thrown BadRequestException');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const message = (error as BadRequestException).message;
        expect(message).toContain(';');
        expect(message).toContain('name must be longer than or equal to 1 characters');
        expect(message).toContain('email must be an email');
      }
    });
  });
});
