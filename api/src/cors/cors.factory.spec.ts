import { INestApplication } from '@nestjs/common';
import { Mock } from 'ts-jest-mocker';
import { DISMISSIBLE_LOGGER } from '@dismissible/nestjs-logger';
import { configureAppWithCors } from './cors.factory';
import { CorsConfig } from './cors.config';

describe('configureAppWithCors', () => {
  let mockApp: Mock<INestApplication>;
  let mockGet: jest.Mock;
  let mockEnableCors: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGet = jest.fn();
    mockEnableCors = jest.fn();
    mockApp = {
      get: mockGet,
      enableCors: mockEnableCors,
    } as any;
  });

  it('should configure CORS when enabled is true with full config', () => {
    const corsConfig: CorsConfig = {
      enabled: true,
      origins: ['https://example.com', 'https://app.example.com'],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Custom-Header'],
      credentials: false,
      maxAge: 3600,
    };
    const mockLogger = {
      info: jest.fn(),
      setContext: jest.fn(),
    };
    mockGet.mockImplementation((token) => {
      if (token === CorsConfig) {
        return corsConfig;
      }
      if (token === DISMISSIBLE_LOGGER) {
        return mockLogger;
      }
      return null;
    });

    configureAppWithCors(mockApp);

    expect(mockLogger.setContext).toHaveBeenCalledWith('CORS');
    expect(mockEnableCors).toHaveBeenCalledWith({
      origin: ['https://example.com', 'https://app.example.com'],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Custom-Header'],
      credentials: false,
      maxAge: 3600,
    });
    expect(mockLogger.info).toHaveBeenCalledWith('CORS is enabled', { corsConfig });
  });

  it('should configure CORS with partial config using defaults for missing values', () => {
    const corsConfig: CorsConfig = {
      enabled: true,
      origins: ['https://custom.com'],
      credentials: false,
    };
    const mockLogger = {
      info: jest.fn(),
      setContext: jest.fn(),
    };
    mockGet.mockImplementation((token) => {
      if (token === CorsConfig) {
        return corsConfig;
      }
      if (token === DISMISSIBLE_LOGGER) {
        return mockLogger;
      }
      return null;
    });

    configureAppWithCors(mockApp);

    expect(mockEnableCors).toHaveBeenCalledWith({
      origin: ['https://custom.com'],
      methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
      credentials: false,
      maxAge: 86400,
    });
    expect(mockLogger.info).toHaveBeenCalledWith('CORS is enabled', { corsConfig });
  });

  it('should not configure CORS when enabled is false', () => {
    const corsConfig: CorsConfig = {
      enabled: false,
    };
    const mockLogger = {
      info: jest.fn(),
      setContext: jest.fn(),
    };
    mockGet.mockImplementation((token) => {
      if (token === CorsConfig) {
        return corsConfig;
      }
      if (token === DISMISSIBLE_LOGGER) {
        return mockLogger;
      }
      return null;
    });

    configureAppWithCors(mockApp);

    expect(mockLogger.setContext).toHaveBeenCalledWith('CORS');
    expect(mockEnableCors).not.toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith('CORS is disabled');
  });

  it('should set logger context before checking config', () => {
    const corsConfig: CorsConfig = {
      enabled: true,
      origins: ['http://localhost:3000'],
    };
    const mockLogger = {
      info: jest.fn(),
      setContext: jest.fn(),
    };
    mockGet.mockImplementation((token) => {
      if (token === CorsConfig) {
        return corsConfig;
      }
      if (token === DISMISSIBLE_LOGGER) {
        return mockLogger;
      }
      return null;
    });

    configureAppWithCors(mockApp);

    // Verify setContext is called before enableCors
    const setContextCallOrder = mockLogger.setContext.mock.invocationCallOrder[0];
    const enableCorsCallOrder = mockEnableCors.mock.invocationCallOrder[0];
    expect(setContextCallOrder).toBeLessThan(enableCorsCallOrder);
  });
});
