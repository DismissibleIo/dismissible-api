import { BadRequestException, ArgumentMetadata } from '@nestjs/common';
import { ParamValidationPipe } from './param-validation.pipe';
import { VALIDATION_CONSTANTS } from '../../validation/dismissible-input.dto';

describe('ParamValidationPipe', () => {
  let pipe: ParamValidationPipe;

  beforeEach(() => {
    pipe = new ParamValidationPipe();
  });

  describe('valid values', () => {
    it('should pass validation for a valid alphanumeric string', () => {
      const metadata: ArgumentMetadata = {
        type: 'param',
        data: 'userId',
      };
      const result = pipe.transform('user123', metadata);
      expect(result).toBe('user123');
    });

    it('should pass validation for a string with dashes', () => {
      const metadata: ArgumentMetadata = {
        type: 'param',
        data: 'itemId',
      };
      const result = pipe.transform('item-123', metadata);
      expect(result).toBe('item-123');
    });

    it('should pass validation for a string with underscores', () => {
      const metadata: ArgumentMetadata = {
        type: 'param',
        data: 'userId',
      };
      const result = pipe.transform('user_123', metadata);
      expect(result).toBe('user_123');
    });

    it('should pass validation for a string with mixed valid characters', () => {
      const metadata: ArgumentMetadata = {
        type: 'param',
        data: 'itemId',
      };
      const result = pipe.transform('item-123_test', metadata);
      expect(result).toBe('item-123_test');
    });

    it('should pass validation for minimum length (1 character)', () => {
      const metadata: ArgumentMetadata = {
        type: 'param',
        data: 'userId',
      };
      const result = pipe.transform('a', metadata);
      expect(result).toBe('a');
    });

    it('should pass validation for maximum length (64 characters)', () => {
      const metadata: ArgumentMetadata = {
        type: 'param',
        data: 'itemId',
      };
      const validMaxLength = 'a'.repeat(VALIDATION_CONSTANTS.ID_MAX_LENGTH);
      const result = pipe.transform(validMaxLength, metadata);
      expect(result).toBe(validMaxLength);
    });
  });

  describe('empty or null values', () => {
    it('should throw BadRequestException for empty string', () => {
      const metadata: ArgumentMetadata = {
        type: 'param',
        data: 'userId',
      };
      expect(() => pipe.transform('', metadata)).toThrow(BadRequestException);
      expect(() => pipe.transform('', metadata)).toThrow('userId is required');
    });

    it('should throw BadRequestException for whitespace-only string', () => {
      const metadata: ArgumentMetadata = {
        type: 'param',
        data: 'itemId',
      };
      expect(() => pipe.transform('   ', metadata)).toThrow(BadRequestException);
      expect(() => pipe.transform('   ', metadata)).toThrow('itemId is required');
    });

    it('should throw BadRequestException for null value', () => {
      const metadata: ArgumentMetadata = {
        type: 'param',
        data: 'userId',
      };
      expect(() => pipe.transform(null as any, metadata)).toThrow(BadRequestException);
      expect(() => pipe.transform(null as any, metadata)).toThrow('userId is required');
    });

    it('should throw BadRequestException for undefined value', () => {
      const metadata: ArgumentMetadata = {
        type: 'param',
        data: 'itemId',
      };
      expect(() => pipe.transform(undefined as any, metadata)).toThrow(BadRequestException);
      expect(() => pipe.transform(undefined as any, metadata)).toThrow('itemId is required');
    });

    it('should use default parameter name when metadata.data is not provided', () => {
      const metadata: ArgumentMetadata = {
        type: 'param',
      };
      expect(() => pipe.transform('', metadata)).toThrow(BadRequestException);
      expect(() => pipe.transform('', metadata)).toThrow('parameter is required');
    });
  });

  describe('length validation', () => {
    it('should throw BadRequestException for value below minimum length', () => {
      const metadata: ArgumentMetadata = {
        type: 'param',
        data: 'userId',
      };
      expect(() => pipe.transform('', metadata)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for value exceeding maximum length', () => {
      const metadata: ArgumentMetadata = {
        type: 'param',
        data: 'itemId',
      };
      const tooLong = 'a'.repeat(VALIDATION_CONSTANTS.ID_MAX_LENGTH + 1);
      expect(() => pipe.transform(tooLong, metadata)).toThrow(BadRequestException);
      expect(() => pipe.transform(tooLong, metadata)).toThrow(
        `itemId must be at most ${VALIDATION_CONSTANTS.ID_MAX_LENGTH} characters`,
      );
    });
  });

  describe('pattern validation', () => {
    it('should throw BadRequestException for string with spaces', () => {
      const metadata: ArgumentMetadata = {
        type: 'param',
        data: 'userId',
      };
      expect(() => pipe.transform('user 123', metadata)).toThrow(BadRequestException);
      expect(() => pipe.transform('user 123', metadata)).toThrow(
        `userId ${VALIDATION_CONSTANTS.ID_PATTERN_MESSAGE}`,
      );
    });

    it('should throw BadRequestException for string with special characters', () => {
      const metadata: ArgumentMetadata = {
        type: 'param',
        data: 'itemId',
      };
      expect(() => pipe.transform('item@123', metadata)).toThrow(BadRequestException);
      expect(() => pipe.transform('item@123', metadata)).toThrow(
        `itemId ${VALIDATION_CONSTANTS.ID_PATTERN_MESSAGE}`,
      );
    });

    it('should throw BadRequestException for string with dots', () => {
      const metadata: ArgumentMetadata = {
        type: 'param',
        data: 'userId',
      };
      expect(() => pipe.transform('user.123', metadata)).toThrow(BadRequestException);
      expect(() => pipe.transform('user.123', metadata)).toThrow(
        `userId ${VALIDATION_CONSTANTS.ID_PATTERN_MESSAGE}`,
      );
    });

    it('should throw BadRequestException for string with slashes', () => {
      const metadata: ArgumentMetadata = {
        type: 'param',
        data: 'itemId',
      };
      expect(() => pipe.transform('item/123', metadata)).toThrow(BadRequestException);
      expect(() => pipe.transform('item/123', metadata)).toThrow(
        `itemId ${VALIDATION_CONSTANTS.ID_PATTERN_MESSAGE}`,
      );
    });

    it('should throw BadRequestException for string with unicode characters', () => {
      const metadata: ArgumentMetadata = {
        type: 'param',
        data: 'userId',
      };
      expect(() => pipe.transform('userñ123', metadata)).toThrow(BadRequestException);
      expect(() => pipe.transform('userñ123', metadata)).toThrow(
        `userId ${VALIDATION_CONSTANTS.ID_PATTERN_MESSAGE}`,
      );
    });

    it('should throw BadRequestException for string starting with invalid character', () => {
      const metadata: ArgumentMetadata = {
        type: 'param',
        data: 'itemId',
      };
      expect(() => pipe.transform('@item123', metadata)).toThrow(BadRequestException);
      expect(() => pipe.transform('@item123', metadata)).toThrow(
        `itemId ${VALIDATION_CONSTANTS.ID_PATTERN_MESSAGE}`,
      );
    });

    it('should throw BadRequestException for string ending with invalid character', () => {
      const metadata: ArgumentMetadata = {
        type: 'param',
        data: 'userId',
      };
      expect(() => pipe.transform('user123#', metadata)).toThrow(BadRequestException);
      expect(() => pipe.transform('user123#', metadata)).toThrow(
        `userId ${VALIDATION_CONSTANTS.ID_PATTERN_MESSAGE}`,
      );
    });
  });

  describe('error messages', () => {
    it('should include parameter name in required error message', () => {
      const metadata: ArgumentMetadata = {
        type: 'param',
        data: 'customParam',
      };
      try {
        pipe.transform('', metadata);
        fail('Should have thrown BadRequestException');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toBe('customParam is required');
      }
    });

    it('should include parameter name in length error message', () => {
      const metadata: ArgumentMetadata = {
        type: 'param',
        data: 'testParam',
      };
      const tooLong = 'a'.repeat(VALIDATION_CONSTANTS.ID_MAX_LENGTH + 1);
      try {
        pipe.transform(tooLong, metadata);
        fail('Should have thrown BadRequestException');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain('testParam');
        expect((error as BadRequestException).message).toContain(
          `must be at most ${VALIDATION_CONSTANTS.ID_MAX_LENGTH} characters`,
        );
      }
    });

    it('should include parameter name in pattern error message', () => {
      const metadata: ArgumentMetadata = {
        type: 'param',
        data: 'myParam',
      };
      try {
        pipe.transform('invalid@value', metadata);
        fail('Should have thrown BadRequestException');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain('myParam');
        expect((error as BadRequestException).message).toContain(
          VALIDATION_CONSTANTS.ID_PATTERN_MESSAGE,
        );
      }
    });
  });

  describe('edge cases', () => {
    it('should handle numeric-only strings', () => {
      const metadata: ArgumentMetadata = {
        type: 'param',
        data: 'itemId',
      };
      const result = pipe.transform('123456', metadata);
      expect(result).toBe('123456');
    });

    it('should handle uppercase letters', () => {
      const metadata: ArgumentMetadata = {
        type: 'param',
        data: 'userId',
      };
      const result = pipe.transform('USER123', metadata);
      expect(result).toBe('USER123');
    });

    it('should handle lowercase letters', () => {
      const metadata: ArgumentMetadata = {
        type: 'param',
        data: 'itemId',
      };
      const result = pipe.transform('user123', metadata);
      expect(result).toBe('user123');
    });

    it('should handle mixed case letters', () => {
      const metadata: ArgumentMetadata = {
        type: 'param',
        data: 'userId',
      };
      const result = pipe.transform('User123Item', metadata);
      expect(result).toBe('User123Item');
    });

    it('should handle string with only dashes and underscores', () => {
      const metadata: ArgumentMetadata = {
        type: 'param',
        data: 'itemId',
      };
      const result = pipe.transform('_-', metadata);
      expect(result).toBe('_-');
    });
  });
});
