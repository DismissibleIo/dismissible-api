import { ConfigModule } from './config.module';
import { TypedConfigModule } from 'nest-typed-config';
import { fileLoader } from 'nest-typed-config';

jest.mock('nest-typed-config', () => ({
  TypedConfigModule: {
    forRoot: jest.fn(),
  },
  fileLoader: jest.fn(),
}));

jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
}));

describe('ConfigModule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('forRoot', () => {
    it('should return a dynamic module with default path', () => {
      const mockSchema = class TestSchema {};
      const mockFileLoader = jest.fn();
      (fileLoader as jest.Mock).mockReturnValue(mockFileLoader);
      (TypedConfigModule.forRoot as jest.Mock).mockReturnValue({});

      const result = ConfigModule.forRoot({
        schema: mockSchema,
      });

      expect(result.module).toBe(ConfigModule);
      expect(result.exports).toContain(TypedConfigModule);
      expect(fileLoader).toHaveBeenCalledWith({
        basename: '.env',
        searchFrom: expect.stringContaining('config'),
        ignoreEnvironmentVariableSubstitution: false,
      });
      expect(TypedConfigModule.forRoot).toHaveBeenCalledWith({
        schema: mockSchema,
        load: [mockFileLoader],
      });
    });

    it('should use custom path when provided', () => {
      const mockSchema = class TestSchema {};
      const customPath = '/custom/config/path';
      const mockFileLoader = jest.fn();
      (fileLoader as jest.Mock).mockReturnValue(mockFileLoader);
      (TypedConfigModule.forRoot as jest.Mock).mockReturnValue({});

      const result = ConfigModule.forRoot({
        schema: mockSchema,
        path: customPath,
      });

      expect(result.module).toBe(ConfigModule);
      expect(fileLoader).toHaveBeenCalledWith({
        basename: '.env',
        searchFrom: customPath,
        ignoreEnvironmentVariableSubstitution: false,
      });
    });

    it('should respect ignoreEnvironmentVariableSubstitution option', () => {
      const mockSchema = class TestSchema {};
      const mockFileLoader = jest.fn();
      (fileLoader as jest.Mock).mockReturnValue(mockFileLoader);
      (TypedConfigModule.forRoot as jest.Mock).mockReturnValue({});

      ConfigModule.forRoot({
        schema: mockSchema,
        ignoreEnvironmentVariableSubstitution: true,
      });

      expect(fileLoader).toHaveBeenCalledWith({
        basename: '.env',
        searchFrom: expect.any(String),
        ignoreEnvironmentVariableSubstitution: true,
      });
    });

    it('should include TypedConfigModule in imports', () => {
      const mockSchema = class TestSchema {};
      const mockFileLoader = jest.fn();
      (fileLoader as jest.Mock).mockReturnValue(mockFileLoader);
      const mockTypedConfigModule = {};
      (TypedConfigModule.forRoot as jest.Mock).mockReturnValue(mockTypedConfigModule);

      const result = ConfigModule.forRoot({
        schema: mockSchema,
      });

      expect(result.imports).toContain(mockTypedConfigModule);
    });
  });
});
