import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { TransformCommaSeparated } from './transform-comma-separated.decorator';

class TestConfig {
  @TransformCommaSeparated()
  value!: string[] | string;
}

describe('TransformCommaSeparated', () => {
  it('should transform comma-separated string into array of trimmed strings', () => {
    const config = plainToInstance(TestConfig, { value: 'GET,POST,DELETE' });
    expect(config.value).toEqual(['GET', 'POST', 'DELETE']);
  });

  it('should trim whitespace from each element', () => {
    const config = plainToInstance(TestConfig, { value: 'a , b , c' });
    expect(config.value).toEqual(['a', 'b', 'c']);
  });

  it('should handle single value string', () => {
    const config = plainToInstance(TestConfig, { value: 'GET' });
    expect(config.value).toEqual(['GET']);
  });

  it('should return array as-is when value is already an array', () => {
    const config = plainToInstance(TestConfig, { value: ['a', 'b'] });
    expect(config.value).toEqual(['a', 'b']);
  });

  it('should handle empty string', () => {
    const config = plainToInstance(TestConfig, { value: '' });
    expect(config.value).toEqual(['']);
  });

  it('should handle string with only whitespace', () => {
    const config = plainToInstance(TestConfig, { value: '  ' });
    expect(config.value).toEqual(['']);
  });
});
