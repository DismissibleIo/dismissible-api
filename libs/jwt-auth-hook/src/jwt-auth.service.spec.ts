import { mock, Mock } from 'ts-jest-mocker';
import { of, throwError } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { plainToInstance } from 'class-transformer';
import { JwtAuthService } from './jwt-auth.service';
import { JwtAuthHookConfig } from './jwt-auth-hook.config';
import { IDismissibleLogger } from '@dismissible/nestjs-logger';

describe('JwtAuthService', () => {
  let service: JwtAuthService;
  let mockHttpService: Mock<HttpService>;
  let mockLogger: Mock<IDismissibleLogger>;
  let mockConfig: JwtAuthHookConfig;

  beforeEach(() => {
    mockHttpService = mock(HttpService, { failIfMockNotProvided: false });
    mockLogger = mock<IDismissibleLogger>({ failIfMockNotProvided: false });
    mockConfig = {
      enabled: true,
      wellKnownUrl: 'https://auth.example.com/.well-known/openid-configuration',
      issuer: ['https://auth.example.com'],
      audience: 'my-api',
    };

    service = new JwtAuthService(mockHttpService, mockConfig, mockLogger);
  });

  describe('extractBearerToken', () => {
    it('should return null when header is undefined', () => {
      const result = service.extractBearerToken(undefined);
      expect(result).toBeNull();
    });

    it('should return null when header is empty', () => {
      const result = service.extractBearerToken('');
      expect(result).toBeNull();
    });

    it('should return null when header does not start with Bearer', () => {
      const result = service.extractBearerToken('Basic abc123');
      expect(result).toBeNull();
    });

    it('should return null when Bearer has no token', () => {
      const result = service.extractBearerToken('Bearer');
      expect(result).toBeNull();
    });

    it('should return null when header has too many parts', () => {
      const result = service.extractBearerToken('Bearer token extra');
      expect(result).toBeNull();
    });

    it('should extract token from valid Bearer header', () => {
      const result = service.extractBearerToken('Bearer eyJhbGciOiJSUzI1NiJ9.test.sig');
      expect(result).toBe('eyJhbGciOiJSUzI1NiJ9.test.sig');
    });

    it('should be case-insensitive for Bearer prefix', () => {
      const result = service.extractBearerToken('bearer eyJhbGciOiJSUzI1NiJ9.test.sig');
      expect(result).toBe('eyJhbGciOiJSUzI1NiJ9.test.sig');
    });

    it('should handle BEARER in uppercase', () => {
      const result = service.extractBearerToken('BEARER eyJhbGciOiJSUzI1NiJ9.test.sig');
      expect(result).toBe('eyJhbGciOiJSUzI1NiJ9.test.sig');
    });
  });

  describe('onModuleInit', () => {
    it('should not initialize JWKS client when disabled', async () => {
      const disabledConfig: JwtAuthHookConfig = {
        ...mockConfig,
        enabled: false,
      };
      const disabledService = new JwtAuthService(mockHttpService, disabledConfig, mockLogger);

      await disabledService.onModuleInit();

      expect(mockHttpService.get).not.toHaveBeenCalled();
    });
  });

  describe('validateToken', () => {
    it('should return invalid when JWKS client is not initialized', async () => {
      const result = await service.validateToken('some-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('JWKS client not initialized');
    });

    it('should return invalid for malformed token', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          jwks_uri: 'https://auth.example.com/.well-known/jwks.json',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} } as AxiosResponse['config'],
      };
      mockHttpService.get.mockReturnValue(of(mockResponse));

      await service.initializeJwksClient();

      const result = await service.validateToken('not-a-valid-jwt');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid token format');
    });

    it('should return invalid when token is a string (not object)', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          jwks_uri: 'https://auth.example.com/.well-known/jwks.json',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} } as AxiosResponse['config'],
      };
      mockHttpService.get.mockReturnValue(of(mockResponse));

      await service.initializeJwksClient();

      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'decode').mockReturnValue('string-token');

      const result = await service.validateToken('some-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid token format');
    });

    it('should return invalid when token is missing kid', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          jwks_uri: 'https://auth.example.com/.well-known/jwks.json',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} } as AxiosResponse['config'],
      };
      mockHttpService.get.mockReturnValue(of(mockResponse));

      await service.initializeJwksClient();

      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'decode').mockReturnValue({
        header: {},
        payload: {},
      });

      const result = await service.validateToken('some-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token missing key ID (kid)');
    });

    it('should return invalid when signing key cannot be found', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          jwks_uri: 'https://auth.example.com/.well-known/jwks.json',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} } as AxiosResponse['config'],
      };
      mockHttpService.get.mockReturnValue(of(mockResponse));

      await service.initializeJwksClient();

      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'decode').mockReturnValue({
        header: { kid: 'key-id-123' },
        payload: {},
      });

      const mockJwksClient = (service as any).jwksClient;
      jest.spyOn(mockJwksClient, 'getSigningKey').mockRejectedValue(new Error('Key not found'));

      const result = await service.validateToken('some-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Unable to find signing key');
    });

    it('should successfully validate token with issuer and audience', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          jwks_uri: 'https://auth.example.com/.well-known/jwks.json',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} } as AxiosResponse['config'],
      };
      mockHttpService.get.mockReturnValue(of(mockResponse));

      await service.initializeJwksClient();

      const jwt = require('jsonwebtoken');
      const mockPayload = {
        sub: 'user-123',
        iss: 'https://auth.example.com',
        aud: 'my-api',
      };

      jest.spyOn(jwt, 'decode').mockReturnValue({
        header: { kid: 'key-id-123' },
        payload: mockPayload,
      });

      const mockSigningKey = {
        getPublicKey: jest.fn().mockReturnValue('public-key'),
      };
      const mockJwksClient = (service as any).jwksClient;
      jest.spyOn(mockJwksClient, 'getSigningKey').mockResolvedValue(mockSigningKey);
      jest.spyOn(jwt, 'verify').mockReturnValue(mockPayload);

      const result = await service.validateToken('valid-token');

      expect(result.valid).toBe(true);
      expect(result.payload).toEqual(mockPayload);
      expect(jwt.verify).toHaveBeenCalledWith(
        'valid-token',
        'public-key',
        expect.objectContaining({
          algorithms: ['RS256'],
          issuer: 'https://auth.example.com',
          audience: 'my-api',
        }),
      );
    });

    it('should successfully validate token with single issuer in array', async () => {
      const configWithSingleIssuerArray: JwtAuthHookConfig = {
        enabled: true,
        wellKnownUrl: 'https://auth.example.com/.well-known/openid-configuration',
        issuer: ['https://auth.example.com'],
        audience: 'my-api',
      };
      const serviceWithSingleIssuer = new JwtAuthService(
        mockHttpService,
        configWithSingleIssuerArray,
        mockLogger,
      );

      const mockResponse: AxiosResponse = {
        data: {
          jwks_uri: 'https://auth.example.com/.well-known/jwks.json',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} } as AxiosResponse['config'],
      };
      mockHttpService.get.mockReturnValue(of(mockResponse));

      await serviceWithSingleIssuer.initializeJwksClient();

      const jwt = require('jsonwebtoken');
      const mockPayload = {
        sub: 'user-123',
        iss: 'https://auth.example.com',
        aud: 'my-api',
      };

      jest.spyOn(jwt, 'decode').mockReturnValue({
        header: { kid: 'key-id-123' },
        payload: mockPayload,
      });

      const mockSigningKey = {
        getPublicKey: jest.fn().mockReturnValue('public-key'),
      };
      const mockJwksClient = (serviceWithSingleIssuer as any).jwksClient;
      jest.spyOn(mockJwksClient, 'getSigningKey').mockResolvedValue(mockSigningKey);
      jest.spyOn(jwt, 'verify').mockReturnValue(mockPayload);

      const result = await serviceWithSingleIssuer.validateToken('valid-token');

      expect(result.valid).toBe(true);
      expect(result.payload).toEqual(mockPayload);
      expect(jwt.verify).toHaveBeenCalledWith(
        'valid-token',
        'public-key',
        expect.objectContaining({
          algorithms: ['RS256'],
          issuer: 'https://auth.example.com',
          audience: 'my-api',
        }),
      );
    });

    it('should successfully validate token when issuer matches one of multiple issuers', async () => {
      const configWithMultipleIssuers: JwtAuthHookConfig = {
        enabled: true,
        wellKnownUrl: 'https://auth.example.com/.well-known/openid-configuration',
        issuer: [
          'https://auth.example.com',
          'https://auth2.example.com',
          'https://auth3.example.com',
        ],
        audience: 'my-api',
      };
      const serviceWithMultipleIssuers = new JwtAuthService(
        mockHttpService,
        configWithMultipleIssuers,
        mockLogger,
      );

      const mockResponse: AxiosResponse = {
        data: {
          jwks_uri: 'https://auth.example.com/.well-known/jwks.json',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} } as AxiosResponse['config'],
      };
      mockHttpService.get.mockReturnValue(of(mockResponse));

      await serviceWithMultipleIssuers.initializeJwksClient();

      const jwt = require('jsonwebtoken');
      const mockPayload = {
        sub: 'user-123',
        iss: 'https://auth2.example.com', // Matches second issuer
        aud: 'my-api',
      };

      jest.spyOn(jwt, 'decode').mockReturnValue({
        header: { kid: 'key-id-123' },
        payload: mockPayload,
      });

      const mockSigningKey = {
        getPublicKey: jest.fn().mockReturnValue('public-key'),
      };
      const mockJwksClient = (serviceWithMultipleIssuers as any).jwksClient;
      jest.spyOn(mockJwksClient, 'getSigningKey').mockResolvedValue(mockSigningKey);
      jest.spyOn(jwt, 'verify').mockReturnValue(mockPayload);

      const result = await serviceWithMultipleIssuers.validateToken('valid-token');

      expect(result.valid).toBe(true);
      expect(result.payload).toEqual(mockPayload);
      expect(jwt.verify).toHaveBeenCalledWith(
        'valid-token',
        'public-key',
        expect.objectContaining({
          algorithms: ['RS256'],
          issuer: [
            'https://auth.example.com',
            'https://auth2.example.com',
            'https://auth3.example.com',
          ],
          audience: 'my-api',
        }),
      );
    });

    it('should return invalid when token issuer does not match any of the configured issuers', async () => {
      const configWithMultipleIssuers: JwtAuthHookConfig = {
        enabled: true,
        wellKnownUrl: 'https://auth.example.com/.well-known/openid-configuration',
        issuer: ['https://auth.example.com', 'https://auth2.example.com'],
        audience: 'my-api',
      };
      const serviceWithMultipleIssuers = new JwtAuthService(
        mockHttpService,
        configWithMultipleIssuers,
        mockLogger,
      );

      const mockResponse: AxiosResponse = {
        data: {
          jwks_uri: 'https://auth.example.com/.well-known/jwks.json',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} } as AxiosResponse['config'],
      };
      mockHttpService.get.mockReturnValue(of(mockResponse));

      await serviceWithMultipleIssuers.initializeJwksClient();

      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'decode').mockReturnValue({
        header: { kid: 'key-id-123' },
        payload: {},
      });

      const mockSigningKey = {
        getPublicKey: jest.fn().mockReturnValue('public-key'),
      };
      const mockJwksClient = (serviceWithMultipleIssuers as any).jwksClient;
      jest.spyOn(mockJwksClient, 'getSigningKey').mockResolvedValue(mockSigningKey);
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new Error(
          'jwt issuer invalid. expected: https://auth.example.com or https://auth2.example.com',
        );
      });

      const result = await serviceWithMultipleIssuers.validateToken('invalid-issuer-token');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('issuer invalid');
      expect(jwt.verify).toHaveBeenCalledWith(
        'invalid-issuer-token',
        'public-key',
        expect.objectContaining({
          algorithms: ['RS256'],
          issuer: ['https://auth.example.com', 'https://auth2.example.com'],
          audience: 'my-api',
        }),
      );
    });

    it('should successfully validate token without issuer and audience', async () => {
      const configWithoutIssuerAudience: JwtAuthHookConfig = {
        enabled: true,
        wellKnownUrl: 'https://auth.example.com/.well-known/openid-configuration',
      };
      const serviceWithoutIssuerAudience = new JwtAuthService(
        mockHttpService,
        configWithoutIssuerAudience,
        mockLogger,
      );

      const mockResponse: AxiosResponse = {
        data: {
          jwks_uri: 'https://auth.example.com/.well-known/jwks.json',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} } as AxiosResponse['config'],
      };
      mockHttpService.get.mockReturnValue(of(mockResponse));

      await serviceWithoutIssuerAudience.initializeJwksClient();

      const jwt = require('jsonwebtoken');
      const mockPayload = { sub: 'user-123' };

      jest.spyOn(jwt, 'decode').mockReturnValue({
        header: { kid: 'key-id-123' },
        payload: mockPayload,
      });

      const mockSigningKey = {
        getPublicKey: jest.fn().mockReturnValue('public-key'),
      };
      const mockJwksClient = (serviceWithoutIssuerAudience as any).jwksClient;
      jest.spyOn(mockJwksClient, 'getSigningKey').mockResolvedValue(mockSigningKey);
      const verifySpy = jest.spyOn(jwt, 'verify').mockReturnValue(mockPayload);

      const result = await serviceWithoutIssuerAudience.validateToken('valid-token');

      expect(result.valid).toBe(true);
      const lastCall = verifySpy.mock.calls[verifySpy.mock.calls.length - 1];
      expect(lastCall[2]).not.toHaveProperty('issuer');
      expect(lastCall[2]).not.toHaveProperty('audience');
      expect(lastCall[2]).toHaveProperty('algorithms', ['RS256']);
    });

    it('should return invalid when token verification fails', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          jwks_uri: 'https://auth.example.com/.well-known/jwks.json',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} } as AxiosResponse['config'],
      };
      mockHttpService.get.mockReturnValue(of(mockResponse));

      await service.initializeJwksClient();

      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'decode').mockReturnValue({
        header: { kid: 'key-id-123' },
        payload: {},
      });

      const mockSigningKey = {
        getPublicKey: jest.fn().mockReturnValue('public-key'),
      };
      const mockJwksClient = (service as any).jwksClient;
      jest.spyOn(mockJwksClient, 'getSigningKey').mockResolvedValue(mockSigningKey);
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new Error('Token expired');
      });

      const result = await service.validateToken('expired-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token expired');
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Token validation failed',
        expect.objectContaining({
          error: 'Token expired',
        }),
      );
    });

    it('should handle non-Error objects in verification catch block', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          jwks_uri: 'https://auth.example.com/.well-known/jwks.json',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} } as AxiosResponse['config'],
      };
      mockHttpService.get.mockReturnValue(of(mockResponse));

      await service.initializeJwksClient();

      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'decode').mockReturnValue({
        header: { kid: 'key-id-123' },
        payload: {},
      });

      const mockSigningKey = {
        getPublicKey: jest.fn().mockReturnValue('public-key'),
      };
      const mockJwksClient = (service as any).jwksClient;
      jest.spyOn(mockJwksClient, 'getSigningKey').mockResolvedValue(mockSigningKey);
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        throw 'String error';
      });

      const result = await service.validateToken('invalid-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('String error');
    });

    it('should use custom algorithms from config', async () => {
      const configWithAlgorithms: JwtAuthHookConfig = {
        ...mockConfig,
        algorithms: ['RS256', 'RS384'],
      };
      const serviceWithAlgorithms = new JwtAuthService(
        mockHttpService,
        configWithAlgorithms,
        mockLogger,
      );

      const mockResponse: AxiosResponse = {
        data: {
          jwks_uri: 'https://auth.example.com/.well-known/jwks.json',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} } as AxiosResponse['config'],
      };
      mockHttpService.get.mockReturnValue(of(mockResponse));

      await serviceWithAlgorithms.initializeJwksClient();

      const jwt = require('jsonwebtoken');
      const mockPayload = { sub: 'user-123' };

      jest.spyOn(jwt, 'decode').mockReturnValue({
        header: { kid: 'key-id-123' },
        payload: mockPayload,
      });

      const mockSigningKey = {
        getPublicKey: jest.fn().mockReturnValue('public-key'),
      };
      const mockJwksClient = (serviceWithAlgorithms as any).jwksClient;
      jest.spyOn(mockJwksClient, 'getSigningKey').mockResolvedValue(mockSigningKey);
      jest.spyOn(jwt, 'verify').mockReturnValue(mockPayload);

      await serviceWithAlgorithms.validateToken('valid-token');

      expect(jwt.verify).toHaveBeenCalledWith(
        'valid-token',
        'public-key',
        expect.objectContaining({
          algorithms: ['RS256', 'RS384'],
        }),
      );
    });

    it('should use algorithms from comma-separated string after transformation', async () => {
      // Simulate config transformation from comma-separated string
      const configWithCommaSeparatedAlgorithms = plainToInstance(JwtAuthHookConfig, {
        enabled: true,
        wellKnownUrl: 'https://auth.example.com/.well-known/openid-configuration',
        issuer: ['https://auth.example.com'],
        audience: 'my-api',
        algorithms: 'RS256,RS384,RS512', // Comma-separated string
      });

      const serviceWithAlgorithms = new JwtAuthService(
        mockHttpService,
        configWithCommaSeparatedAlgorithms,
        mockLogger,
      );

      const mockResponse: AxiosResponse = {
        data: {
          jwks_uri: 'https://auth.example.com/.well-known/jwks.json',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} } as AxiosResponse['config'],
      };
      mockHttpService.get.mockReturnValue(of(mockResponse));

      await serviceWithAlgorithms.initializeJwksClient();

      const jwt = require('jsonwebtoken');
      const mockPayload = { sub: 'user-123' };

      jest.spyOn(jwt, 'decode').mockReturnValue({
        header: { kid: 'key-id-123' },
        payload: mockPayload,
      });

      const mockSigningKey = {
        getPublicKey: jest.fn().mockReturnValue('public-key'),
      };
      const mockJwksClient = (serviceWithAlgorithms as any).jwksClient;
      jest.spyOn(mockJwksClient, 'getSigningKey').mockResolvedValue(mockSigningKey);
      jest.spyOn(jwt, 'verify').mockReturnValue(mockPayload);

      await serviceWithAlgorithms.validateToken('valid-token');

      // Verify that the comma-separated string was transformed to an array
      expect(configWithCommaSeparatedAlgorithms.algorithms).toEqual(['RS256', 'RS384', 'RS512']);
      expect(jwt.verify).toHaveBeenCalledWith(
        'valid-token',
        'public-key',
        expect.objectContaining({
          algorithms: ['RS256', 'RS384', 'RS512'],
        }),
      );
    });
  });

  describe('initializeJwksClient', () => {
    it('should fetch well-known configuration and initialize JWKS client', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          jwks_uri: 'https://auth.example.com/.well-known/jwks.json',
          issuer: 'https://auth.example.com',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} } as AxiosResponse['config'],
      };
      mockHttpService.get.mockReturnValue(of(mockResponse));

      await service.initializeJwksClient();

      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://auth.example.com/.well-known/openid-configuration',
        expect.objectContaining({
          timeout: 30000,
        }),
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'JWKS client initialized successfully',
        expect.objectContaining({
          jwksUri: 'https://auth.example.com/.well-known/jwks.json',
        }),
      );
    });

    it('should throw error when well-known fetch fails', async () => {
      mockHttpService.get.mockReturnValue(throwError(() => new Error('Network error')));

      await expect(service.initializeJwksClient()).rejects.toThrow('Network error');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should throw error when jwks_uri is missing', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          issuer: 'https://auth.example.com',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} } as AxiosResponse['config'],
      };
      mockHttpService.get.mockReturnValue(of(mockResponse));

      await expect(service.initializeJwksClient()).rejects.toThrow(
        'No jwks_uri found in OpenID configuration',
      );
    });

    it('should use custom timeout from config', async () => {
      const configWithTimeout: JwtAuthHookConfig = {
        ...mockConfig,
        requestTimeout: 5000,
      };
      const serviceWithTimeout = new JwtAuthService(mockHttpService, configWithTimeout, mockLogger);

      const mockResponse: AxiosResponse = {
        data: {
          jwks_uri: 'https://auth.example.com/.well-known/jwks.json',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} } as AxiosResponse['config'],
      };
      mockHttpService.get.mockReturnValue(of(mockResponse));

      await serviceWithTimeout.initializeJwksClient();

      expect(mockHttpService.get).toHaveBeenCalledWith(
        mockConfig.wellKnownUrl,
        expect.objectContaining({
          timeout: 5000,
        }),
      );
    });

    it('should use custom jwksCacheDuration from config', async () => {
      const configWithCacheDuration: JwtAuthHookConfig = {
        ...mockConfig,
        jwksCacheDuration: 300000, // 5 minutes
      };
      const serviceWithCacheDuration = new JwtAuthService(
        mockHttpService,
        configWithCacheDuration,
        mockLogger,
      );

      const mockResponse: AxiosResponse = {
        data: {
          jwks_uri: 'https://auth.example.com/.well-known/jwks.json',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} } as AxiosResponse['config'],
      };
      mockHttpService.get.mockReturnValue(of(mockResponse));

      await serviceWithCacheDuration.initializeJwksClient();

      expect((serviceWithCacheDuration as any).jwksClient).toBeDefined();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'JWKS client initialized successfully',
        expect.any(Object),
      );
    });
  });

  describe('configuration options', () => {
    it('should use default algorithms when not specified', () => {
      const configWithoutAlgorithms: JwtAuthHookConfig = {
        enabled: true,
        wellKnownUrl: 'https://auth.example.com/.well-known/openid-configuration',
      };
      const serviceWithDefaults = new JwtAuthService(
        mockHttpService,
        configWithoutAlgorithms,
        mockLogger,
      );

      expect(serviceWithDefaults).toBeDefined();
    });

    it('should accept custom algorithms', () => {
      const configWithAlgorithms: JwtAuthHookConfig = {
        ...mockConfig,
        algorithms: ['RS256', 'RS384'],
      };
      const serviceWithAlgorithms = new JwtAuthService(
        mockHttpService,
        configWithAlgorithms,
        mockLogger,
      );

      expect(serviceWithAlgorithms).toBeDefined();
    });
  });
});
