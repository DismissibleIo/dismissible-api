import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { StorageConfig, StorageType } from './storage.config';
import { PostgresStorageConfig } from '@dismissible/nestjs-postgres-storage';
import { DynamoDBStorageConfig } from '@dismissible/nestjs-dynamodb-storage';

describe('StorageConfig', () => {
  describe('transformation', () => {
    it('should transform storage type correctly for postgres', () => {
      const config = plainToInstance(StorageConfig, {
        type: 'postgres',
      });

      expect(config.type).toBe(StorageType.POSTGRES);
    });

    it('should transform storage type correctly for dynamodb', () => {
      const config = plainToInstance(StorageConfig, {
        type: 'dynamodb',
      });

      expect(config.type).toBe(StorageType.DYNAMODB);
    });

    it('should transform storage type correctly for memory', () => {
      const config = plainToInstance(StorageConfig, {
        type: 'memory',
      });

      expect(config.type).toBe(StorageType.MEMORY);
    });

    it('should include postgres config when type is postgres', () => {
      const config = plainToInstance(StorageConfig, {
        type: StorageType.POSTGRES,
        postgres: { connectionString: 'postgresql://localhost:5432/db' },
      });

      expect(config.postgres).toBeInstanceOf(PostgresStorageConfig);
      expect(config.postgres?.connectionString).toBe('postgresql://localhost:5432/db');
    });

    it('should include dynamodb config when type is dynamodb', () => {
      const config = plainToInstance(StorageConfig, {
        type: StorageType.DYNAMODB,
        dynamodb: { region: 'us-east-1' },
      });

      expect(config.dynamodb).toBeInstanceOf(DynamoDBStorageConfig);
      expect(config.dynamodb?.region).toBe('us-east-1');
    });
  });

  describe('validation', () => {
    it('should pass validation with valid postgres config', async () => {
      const config = plainToInstance(StorageConfig, {
        type: StorageType.POSTGRES,
        postgres: { connectionString: 'postgresql://localhost:5432/db' },
      });
      const errors = await validate(config);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with valid dynamodb config', async () => {
      const config = plainToInstance(StorageConfig, {
        type: StorageType.DYNAMODB,
        dynamodb: {
          region: 'us-east-1',
          tableName: 'test',
          endpoint: 'http://localhost:4566',
          accessKeyId: 'test-key',
          secretAccessKey: 'test-secret',
        },
      });
      const errors = await validate(config);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with memory type', async () => {
      const config = plainToInstance(StorageConfig, {
        type: StorageType.MEMORY,
      });
      const errors = await validate(config);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when type is invalid', async () => {
      const config = plainToInstance(StorageConfig, {
        type: 'invalid-type',
      });
      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      const typeError = errors.find((e) => e.property === 'type');
      expect(typeError).toBeDefined();
    });

    it('should fail validation when postgres connection string is invalid', async () => {
      const config = plainToInstance(StorageConfig, {
        type: StorageType.POSTGRES,
        postgres: { connectionString: 123 },
      });
      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      const postgresError = errors.find((e) => e.property === 'postgres');
      expect(postgresError).toBeDefined();
    });

    it('should fail validation when dynamodb region is invalid', async () => {
      const config = plainToInstance(StorageConfig, {
        type: StorageType.DYNAMODB,
        dynamodb: { region: 123 },
      });
      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      const dynamodbError = errors.find((e) => e.property === 'dynamodb');
      expect(dynamodbError).toBeDefined();
    });
  });
});
