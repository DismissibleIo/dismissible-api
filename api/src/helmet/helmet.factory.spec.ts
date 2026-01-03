import { INestApplication } from '@nestjs/common';
import { Mock } from 'ts-jest-mocker';
import { DISMISSIBLE_LOGGER } from '@dismissible/nestjs-logger';
import { configureAppWithHelmet } from './helmet.factory';
import { HelmetConfig } from './helmet.config';

jest.mock('@fastify/helmet', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('configureAppWithHelmet', () => {
  let mockApp: Mock<INestApplication>;
  let mockGet: jest.Mock;
  let mockRegister: jest.Mock;
  let mockLogger: {
    info: jest.Mock;
    setContext: jest.Mock;
  };
  let mockFastifyHelmetModule: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGet = jest.fn();
    mockRegister = jest.fn().mockResolvedValue(undefined);
    mockLogger = {
      info: jest.fn(),
      setContext: jest.fn(),
    };
    mockApp = {
      get: mockGet,
    } as any;
    // Get the mocked module
    mockFastifyHelmetModule = require('@fastify/helmet').default;
  });

  it('should configure Helmet when enabled is true with full config', async () => {
    const helmetConfig: HelmetConfig = {
      enabled: true,
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      hstsMaxAge: 86400,
      hstsIncludeSubDomains: false,
      hstsPreload: true,
    };
    mockGet.mockImplementation((token) => {
      if (token === HelmetConfig) {
        return helmetConfig;
      }
      if (token === DISMISSIBLE_LOGGER) {
        return mockLogger;
      }
      return null;
    });

    const mockFastifyApp = {
      ...mockApp,
      register: mockRegister,
    } as any;

    await configureAppWithHelmet(mockFastifyApp);

    expect(mockLogger.setContext).toHaveBeenCalledWith('Helmet');
    expect(mockRegister).toHaveBeenCalledWith(mockFastifyHelmetModule, {
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      hsts: {
        maxAge: 86400,
        includeSubDomains: false,
        preload: true,
      },
    });
    expect(mockLogger.info).toHaveBeenCalledWith('Helmet is enabled', { helmetConfig });
  });

  it('should configure Helmet with default values when config values are undefined', async () => {
    const helmetConfig: HelmetConfig = {
      enabled: true,
    };
    mockGet.mockImplementation((token) => {
      if (token === HelmetConfig) {
        return helmetConfig;
      }
      if (token === DISMISSIBLE_LOGGER) {
        return mockLogger;
      }
      return null;
    });

    const mockFastifyApp = {
      ...mockApp,
      register: mockRegister,
    } as any;

    await configureAppWithHelmet(mockFastifyApp);

    expect(mockLogger.setContext).toHaveBeenCalledWith('Helmet');
    expect(mockRegister).toHaveBeenCalledWith(mockFastifyHelmetModule, {
      contentSecurityPolicy: true,
      crossOriginEmbedderPolicy: true,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: false,
      },
    });
    expect(mockLogger.info).toHaveBeenCalledWith('Helmet is enabled', { helmetConfig });
  });

  it('should configure Helmet with partial config using defaults for missing values', async () => {
    const helmetConfig: HelmetConfig = {
      enabled: true,
      contentSecurityPolicy: false,
      hstsMaxAge: 7200,
    };
    mockGet.mockImplementation((token) => {
      if (token === HelmetConfig) {
        return helmetConfig;
      }
      if (token === DISMISSIBLE_LOGGER) {
        return mockLogger;
      }
      return null;
    });

    const mockFastifyApp = {
      ...mockApp,
      register: mockRegister,
    } as any;

    await configureAppWithHelmet(mockFastifyApp);

    expect(mockRegister).toHaveBeenCalledWith(mockFastifyHelmetModule, {
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: true,
      hsts: {
        maxAge: 7200,
        includeSubDomains: true,
        preload: false,
      },
    });
    expect(mockLogger.info).toHaveBeenCalledWith('Helmet is enabled', { helmetConfig });
  });

  it('should not configure Helmet when enabled is false', async () => {
    const helmetConfig: HelmetConfig = {
      enabled: false,
    };
    mockGet.mockImplementation((token) => {
      if (token === HelmetConfig) {
        return helmetConfig;
      }
      if (token === DISMISSIBLE_LOGGER) {
        return mockLogger;
      }
      return null;
    });

    await configureAppWithHelmet(mockApp);

    expect(mockLogger.setContext).toHaveBeenCalledWith('Helmet');
    expect(mockRegister).not.toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith('Helmet is disabled');
  });

  it('should set logger context before checking config', async () => {
    const helmetConfig: HelmetConfig = {
      enabled: true,
    };
    mockGet.mockImplementation((token) => {
      if (token === HelmetConfig) {
        return helmetConfig;
      }
      if (token === DISMISSIBLE_LOGGER) {
        return mockLogger;
      }
      return null;
    });

    const mockFastifyApp = {
      ...mockApp,
      register: mockRegister,
    } as any;

    await configureAppWithHelmet(mockFastifyApp);

    // Verify setContext is called before register
    const setContextCallOrder = mockLogger.setContext.mock.invocationCallOrder[0];
    const registerCallOrder = mockRegister.mock.invocationCallOrder[0];
    expect(setContextCallOrder).toBeLessThan(registerCallOrder);
  });

  it('should handle HSTS config with all custom values', async () => {
    const helmetConfig: HelmetConfig = {
      enabled: true,
      hstsMaxAge: 63072000,
      hstsIncludeSubDomains: false,
      hstsPreload: true,
    };
    mockGet.mockImplementation((token) => {
      if (token === HelmetConfig) {
        return helmetConfig;
      }
      if (token === DISMISSIBLE_LOGGER) {
        return mockLogger;
      }
      return null;
    });

    const mockFastifyApp = {
      ...mockApp,
      register: mockRegister,
    } as any;

    await configureAppWithHelmet(mockFastifyApp);

    expect(mockRegister).toHaveBeenCalledWith(mockFastifyHelmetModule, {
      contentSecurityPolicy: true,
      crossOriginEmbedderPolicy: true,
      hsts: {
        maxAge: 63072000,
        includeSubDomains: false,
        preload: true,
      },
    });
  });
});
