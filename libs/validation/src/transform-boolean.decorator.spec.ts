import 'reflect-metadata';
import { IsBoolean } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { TransformBoolean } from './transform-boolean.decorator';

class TestConfig {
  @IsBoolean()
  @TransformBoolean()
  value!: boolean;
}

class TestConfigWithDefault {
  @IsBoolean()
  @TransformBoolean(true)
  value!: boolean;
}

describe('TransformBoolean', () => {
  describe('without default value', () => {
    it('should transform string "true" to boolean true', () => {
      const config = plainToInstance(TestConfig, { value: 'true' });
      expect(config.value).toBe(true);
    });

    it('should transform string "false" to boolean false', () => {
      const config = plainToInstance(TestConfig, { value: 'false' });
      expect(config.value).toBe(false);
    });

    it('should keep boolean true as true', () => {
      const config = plainToInstance(TestConfig, { value: true });
      expect(config.value).toBe(true);
    });

    it('should keep boolean false as false', () => {
      const config = plainToInstance(TestConfig, { value: false });
      expect(config.value).toBe(false);
    });

    it('should transform other string values to false', () => {
      const config = plainToInstance(TestConfig, { value: 'yes' });
      expect(config.value).toBe(false);
    });

    it('should handle case-insensitive "true"', () => {
      const config = plainToInstance(TestConfig, { value: 'TRUE' });
      expect(config.value).toBe(true);
    });

    it('should handle case-insensitive "True"', () => {
      const config = plainToInstance(TestConfig, { value: 'True' });
      expect(config.value).toBe(true);
    });

    it('should preserve undefined when no default provided', () => {
      const config = plainToInstance(TestConfig, { value: undefined });
      expect(config.value).toBeUndefined();
    });

    it('should preserve null when no default provided', () => {
      const config = plainToInstance(TestConfig, { value: null });
      expect(config.value).toBeNull();
    });

    it('should preserve other types when no default provided', () => {
      const config = plainToInstance(TestConfig, { value: 123 });
      expect(config.value).toBe(123);
    });
  });

  describe('with default value', () => {
    it('should use default value for undefined', () => {
      const config = plainToInstance(TestConfigWithDefault, { value: undefined });
      expect(config.value).toBe(true);
    });

    it('should use default value for null', () => {
      const config = plainToInstance(TestConfigWithDefault, { value: null });
      expect(config.value).toBe(true);
    });

    it('should use default value for other types', () => {
      const config = plainToInstance(TestConfigWithDefault, { value: 123 });
      expect(config.value).toBe(true);
    });

    it('should still transform string "true" to boolean true', () => {
      const config = plainToInstance(TestConfigWithDefault, { value: 'true' });
      expect(config.value).toBe(true);
    });

    it('should still transform string "false" to boolean false', () => {
      const config = plainToInstance(TestConfigWithDefault, { value: 'false' });
      expect(config.value).toBe(false);
    });

    it('should still keep boolean true as true', () => {
      const config = plainToInstance(TestConfigWithDefault, { value: true });
      expect(config.value).toBe(true);
    });
  });
});
