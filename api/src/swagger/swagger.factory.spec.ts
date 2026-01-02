import { INestApplication } from '@nestjs/common';
import { DocumentBuilder } from '@nestjs/swagger';
import { Mock } from 'ts-jest-mocker';
import { configureAppWithSwagger } from './swagger.factory';
import { SwaggerConfig } from './swagger.config';

const mockCreateDocument = jest.fn();
const mockSetup = jest.fn();
const mockSetTitle = jest.fn().mockReturnThis();
const mockSetDescription = jest.fn().mockReturnThis();
const mockSetVersion = jest.fn().mockReturnThis();
const mockBuild = jest.fn().mockReturnValue({});

jest.mock('@nestjs/swagger', () => ({
  SwaggerModule: {
    createDocument: (...args: any[]) => mockCreateDocument(...args),
    setup: (...args: any[]) => mockSetup(...args),
  },
  DocumentBuilder: jest.fn().mockImplementation(() => ({
    setTitle: mockSetTitle,
    setDescription: mockSetDescription,
    setVersion: mockSetVersion,
    build: mockBuild,
  })),
}));

describe('configureAppWithSwagger', () => {
  let mockApp: Mock<INestApplication>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockApp = {} as any;
  });

  it('should configure Swagger when enabled is true', () => {
    const swaggerConfig: SwaggerConfig = {
      enabled: true,
      path: 'docs',
    };

    configureAppWithSwagger(mockApp, swaggerConfig);

    expect(DocumentBuilder).toHaveBeenCalled();
    expect(mockSetTitle).toHaveBeenCalledWith('Dismissible');
    expect(mockSetDescription).toHaveBeenCalledWith('An API to handle dismissible items for users');
    expect(mockSetVersion).toHaveBeenCalledWith('1.0');
    expect(mockBuild).toHaveBeenCalled();
    expect(mockSetup).toHaveBeenCalledWith('docs', mockApp, expect.any(Function), {
      useGlobalPrefix: true,
    });
  });

  it('should use default path "docs" when path is not provided', () => {
    const swaggerConfig: SwaggerConfig = {
      enabled: true,
    };

    configureAppWithSwagger(mockApp, swaggerConfig);

    expect(mockSetup).toHaveBeenCalledWith('docs', mockApp, expect.any(Function), {
      useGlobalPrefix: true,
    });
  });

  it('should use custom path when provided', () => {
    const swaggerConfig: SwaggerConfig = {
      enabled: true,
      path: 'api-docs',
    };

    configureAppWithSwagger(mockApp, swaggerConfig);

    expect(mockSetup).toHaveBeenCalledWith('api-docs', mockApp, expect.any(Function), {
      useGlobalPrefix: true,
    });
  });

  it('should not configure Swagger when enabled is false', () => {
    const swaggerConfig: SwaggerConfig = {
      enabled: false,
    };

    configureAppWithSwagger(mockApp, swaggerConfig);

    expect(DocumentBuilder).not.toHaveBeenCalled();
    expect(mockSetup).not.toHaveBeenCalled();
  });

  it('should create document with correct operationIdFactory', () => {
    const swaggerConfig: SwaggerConfig = {
      enabled: true,
    };

    configureAppWithSwagger(mockApp, swaggerConfig);

    const setupCall = mockSetup.mock.calls[0];
    const documentFactory = setupCall[2];
    documentFactory();

    expect(mockCreateDocument).toHaveBeenCalledWith(
      mockApp,
      {},
      expect.objectContaining({
        operationIdFactory: expect.any(Function),
      }),
    );
  });

  it('should use methodKey as operationId', () => {
    const swaggerConfig: SwaggerConfig = {
      enabled: true,
    };

    configureAppWithSwagger(mockApp, swaggerConfig);

    const setupCall = mockSetup.mock.calls[0];
    const documentFactory = setupCall[2];
    documentFactory();

    const createDocumentCall = mockCreateDocument.mock.calls[0];
    const operationIdFactory = createDocumentCall[2].operationIdFactory;

    expect(operationIdFactory('UserController', 'createUser')).toBe('createUser');
    expect(operationIdFactory('ItemController', 'getItem')).toBe('getItem');
  });
});
