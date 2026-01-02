import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Mock } from 'ts-jest-mocker';
import { DISMISSIBLE_LOGGER } from '@dismissible/nestjs-logger';
import { configureAppWithValidation } from './validation.factory';
import { ValidationConfig } from './validation.config';

jest.mock('@nestjs/common', () => {
  const actual = jest.requireActual('@nestjs/common');
  return {
    ...actual,
    ValidationPipe: jest.fn().mockImplementation((options) => ({
      ...options,
    })),
  };
});

describe('configureAppWithValidation', () => {
  let mockApp: Mock<INestApplication>;
  let mockGet: jest.Mock;
  let mockUseGlobalPipes: jest.Mock;
  let mockLogger: {
    info: jest.Mock;
    setContext: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGet = jest.fn();
    mockUseGlobalPipes = jest.fn();
    mockLogger = {
      info: jest.fn(),
      setContext: jest.fn(),
    };
    mockApp = {
      get: mockGet,
      useGlobalPipes: mockUseGlobalPipes,
    } as any;
  });

  it('should configure ValidationPipe with all config values', () => {
    const validationConfig: ValidationConfig = {
      whitelist: false,
      forbidNonWhitelisted: false,
      transform: false,
      disableErrorMessages: false,
    };
    mockGet.mockImplementation((token) => {
      if (token === ValidationConfig) {
        return validationConfig;
      }
      if (token === DISMISSIBLE_LOGGER) {
        return mockLogger;
      }
      return null;
    });

    configureAppWithValidation(mockApp);

    expect(mockLogger.setContext).toHaveBeenCalledWith('Validation');
    expect(mockLogger.info).toHaveBeenCalledWith('Registering ValidationPipe', {
      validationConfig,
    });
    expect(ValidationPipe).toHaveBeenCalledWith({
      whitelist: false,
      forbidNonWhitelisted: false,
      transform: false,
      disableErrorMessages: false,
    });
    expect(mockUseGlobalPipes).toHaveBeenCalledTimes(1);
  });

  it('should use default values when config values are undefined', () => {
    const validationConfig: ValidationConfig = {};
    mockGet.mockImplementation((token) => {
      if (token === ValidationConfig) {
        return validationConfig;
      }
      if (token === DISMISSIBLE_LOGGER) {
        return mockLogger;
      }
      return null;
    });

    configureAppWithValidation(mockApp);

    expect(ValidationPipe).toHaveBeenCalledWith({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: true,
    });
    expect(mockUseGlobalPipes).toHaveBeenCalledTimes(1);
  });

  it('should use default values when config values are null', () => {
    const validationConfig: ValidationConfig = {
      whitelist: null as any,
      forbidNonWhitelisted: null as any,
      transform: null as any,
      disableErrorMessages: null as any,
    };
    mockGet.mockImplementation((token) => {
      if (token === ValidationConfig) {
        return validationConfig;
      }
      if (token === DISMISSIBLE_LOGGER) {
        return mockLogger;
      }
      return null;
    });

    configureAppWithValidation(mockApp);

    expect(ValidationPipe).toHaveBeenCalledWith({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: true,
    });
    expect(mockUseGlobalPipes).toHaveBeenCalledTimes(1);
  });

  it('should use config values when provided and defaults for undefined', () => {
    const validationConfig: ValidationConfig = {
      whitelist: false,
      transform: true,
    };
    mockGet.mockImplementation((token) => {
      if (token === ValidationConfig) {
        return validationConfig;
      }
      if (token === DISMISSIBLE_LOGGER) {
        return mockLogger;
      }
      return null;
    });

    configureAppWithValidation(mockApp);

    expect(ValidationPipe).toHaveBeenCalledWith({
      whitelist: false,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: true,
    });
    expect(mockUseGlobalPipes).toHaveBeenCalledTimes(1);
  });

  it('should set logger context to Validation', () => {
    const validationConfig: ValidationConfig = {};
    mockGet.mockImplementation((token) => {
      if (token === ValidationConfig) {
        return validationConfig;
      }
      if (token === DISMISSIBLE_LOGGER) {
        return mockLogger;
      }
      return null;
    });

    configureAppWithValidation(mockApp);

    expect(mockLogger.setContext).toHaveBeenCalledWith('Validation');
  });

  it('should log validation config when registering ValidationPipe', () => {
    const validationConfig: ValidationConfig = {
      whitelist: true,
      forbidNonWhitelisted: false,
    };
    mockGet.mockImplementation((token) => {
      if (token === ValidationConfig) {
        return validationConfig;
      }
      if (token === DISMISSIBLE_LOGGER) {
        return mockLogger;
      }
      return null;
    });

    configureAppWithValidation(mockApp);

    expect(mockLogger.info).toHaveBeenCalledWith('Registering ValidationPipe', {
      validationConfig,
    });
  });
});
