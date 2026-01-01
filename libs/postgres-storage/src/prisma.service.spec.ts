import { mock } from 'ts-jest-mocker';
import { PrismaService } from './prisma.service';
import { PostgresStorageConfig } from './postgres-storage.config';
import { IDismissibleLogger } from '@dismissible/nestjs-logger';

const mockPoolInstance = {};
const mockPrismaPgInstance = {};

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => mockPoolInstance),
}));

jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: jest.fn().mockImplementation(() => mockPrismaPgInstance),
}));

const mockPrismaClientMethods = {
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $queryRaw: jest.fn(),
};

jest.mock('../prisma/generated/prisma/client', () => {
  class MockPrismaClient {
    $connect = jest.fn();
    $disconnect = jest.fn();
    $queryRaw = jest.fn();
  }
  return {
    PrismaClient: MockPrismaClient,
  };
});

describe('PrismaService', () => {
  let service: PrismaService;
  let mockConfig: PostgresStorageConfig;
  let mockLogger: jest.Mocked<IDismissibleLogger>;

  beforeEach(() => {
    mockConfig = {
      connectionString: 'postgresql://user:password@localhost:5432/testdb',
    };
    mockLogger = mock<IDismissibleLogger>({ failIfMockNotProvided: false });

    jest.clearAllMocks();
    mockPrismaClientMethods.$connect.mockClear();
    mockPrismaClientMethods.$disconnect.mockClear();
    mockPrismaClientMethods.$queryRaw.mockClear();
  });

  describe('constructor', () => {
    it('should create PrismaService with pool and adapter', () => {
      const { Pool } = require('pg');
      const { PrismaPg } = require('@prisma/adapter-pg');

      service = new PrismaService(mockConfig, mockLogger);

      expect(service).toBeDefined();
      expect(Pool).toHaveBeenCalledWith({
        connectionString: mockConfig.connectionString,
      });
      expect(PrismaPg).toHaveBeenCalledWith(mockPoolInstance);
    });
  });

  describe('onModuleInit', () => {
    it('should connect to database and verify connection', async () => {
      service = new PrismaService(mockConfig, mockLogger);
      (service as any).$connect.mockResolvedValue(undefined);
      (service as any).$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      await service.onModuleInit();

      expect(mockLogger.debug).toHaveBeenCalledWith('Connecting to PostgreSQL database');
      expect((service as any).$connect).toHaveBeenCalled();
      expect((service as any).$queryRaw).toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith('Connected to PostgreSQL database');
    });

    it('should throw error when connection fails', async () => {
      service = new PrismaService(mockConfig, mockLogger);
      const connectError = new Error('Connection refused');
      (service as any).$connect = jest.fn().mockRejectedValue(connectError);

      await expect(service.onModuleInit()).rejects.toThrow('Connection refused');
    });

    it('should throw error when query verification fails', async () => {
      service = new PrismaService(mockConfig, mockLogger);
      (service as any).$connect.mockResolvedValue(undefined);
      (service as any).$queryRaw.mockRejectedValue(new Error('Query failed'));

      await expect(service.onModuleInit()).rejects.toThrow(
        'Database connection failed: Query failed. Ensure PostgreSQL is running and DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING is configured correctly.',
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to connect to PostgreSQL database',
        expect.any(Error),
      );
    });

    it('should handle non-Error objects in catch block', async () => {
      service = new PrismaService(mockConfig, mockLogger);
      (service as any).$connect.mockResolvedValue(undefined);
      (service as any).$queryRaw.mockRejectedValue('String error');

      await expect(service.onModuleInit()).rejects.toThrow(
        'Database connection failed: Unknown error. Ensure PostgreSQL is running and DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING is configured correctly.',
      );
    });
  });

  describe('onModuleDestroy', () => {
    it('should disconnect from database', async () => {
      service = new PrismaService(mockConfig, mockLogger);
      (service as any).$disconnect.mockResolvedValue(undefined);

      await service.onModuleDestroy();

      expect(mockLogger.debug).toHaveBeenCalledWith('Disconnecting from PostgreSQL database');
      expect((service as any).$disconnect).toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith('Disconnected from PostgreSQL database');
    });
  });
});
