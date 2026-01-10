import 'reflect-metadata';
import { IsNumber } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { TransformNumber } from './transform-number.decorator';

class TestConfig {
  @IsNumber()
  @TransformNumber()
  value!: number;
}

describe('TransformNumber', () => {
  it('should transform string "123" to number 123', () => {
    const config = plainToInstance(TestConfig, { value: '123' });
    expect(config.value).toBe(123);
  });

  it('should transform string "0" to number 0', () => {
    const config = plainToInstance(TestConfig, { value: '0' });
    expect(config.value).toBe(0);
  });

  it('should transform string with decimals to number', () => {
    const config = plainToInstance(TestConfig, { value: '3.14' });
    expect(config.value).toBe(3.14);
  });

  it('should transform negative string to negative number', () => {
    const config = plainToInstance(TestConfig, { value: '-42' });
    expect(config.value).toBe(-42);
  });

  it('should keep number as number', () => {
    const config = plainToInstance(TestConfig, { value: 456 });
    expect(config.value).toBe(456);
  });

  it('should keep number 0 as 0', () => {
    const config = plainToInstance(TestConfig, { value: 0 });
    expect(config.value).toBe(0);
  });

  it('should preserve undefined', () => {
    const config = plainToInstance(TestConfig, { value: undefined });
    expect(config.value).toBeUndefined();
  });

  it('should preserve null', () => {
    const config = plainToInstance(TestConfig, { value: null });
    expect(config.value).toBeNull();
  });

  it('should return NaN for non-numeric strings', () => {
    const config = plainToInstance(TestConfig, { value: 'not-a-number' });
    expect(config.value).toBeNaN();
  });
});
