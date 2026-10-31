import { randomUUID } from 'crypto';
import { join } from 'path';
import { INestApplication } from '@nestjs/common';
import { Type } from '@nestjs/common';
import { NullLogger } from '@dismissible/nestjs-logger';
import { DynamoDBStorageAdapter } from '@dismissible/nestjs-dynamodb-storage';
import { PostgresStorageAdapter } from '@dismissible/nestjs-postgres-storage';
import { MemoryStorageAdapter } from '@dismissible/nestjs-storage';
import { NullCacheAdapter } from '@dismissible/nestjs-cache';
import { MemoryCacheAdapter } from '@dismissible/nestjs-memory-cache';
import { RedisCacheAdapter } from '@dismissible/nestjs-redis-cache';
import { createTestApp } from '../../src/app-test.factory';

/**
 * Settings of the services started by `docker compose up`, reached from the host.
 */
const STACK_ENV: NodeJS.ProcessEnv = {
  DISMISSIBLE_CORS_ORIGINS: 'http://localhost:3000',
  DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING:
    'postgresql://postgres:postgres@localhost:5432/dismissible',
  DISMISSIBLE_STORAGE_DYNAMODB_ENDPOINT: 'http://localhost:4566',
  DISMISSIBLE_STORAGE_DYNAMODB_AWS_ACCESS_KEY_ID: 'test',
  DISMISSIBLE_STORAGE_DYNAMODB_AWS_SECRET_ACCESS_KEY: 'test',
  DISMISSIBLE_CACHE_REDIS_URL: 'redis://localhost:6379',
};

export type StorageBackend = 'memory' | 'postgres' | 'dynamodb';
export type CacheBackend = 'none' | 'memory' | 'redis';

export const STORAGE_BACKENDS: [StorageBackend, Type<unknown>][] = [
  ['memory', MemoryStorageAdapter],
  ['postgres', PostgresStorageAdapter],
  ['dynamodb', DynamoDBStorageAdapter],
];

export const CACHE_BACKENDS: [CacheBackend, Type<unknown>][] = [
  ['none', NullCacheAdapter],
  ['memory', MemoryCacheAdapter],
  ['redis', RedisCacheAdapter],
];

/**
 * Boots the app the way a deployment does: from the shipped config file and environment variables.
 */
export async function createStackApp(
  storage: StorageBackend,
  cache: CacheBackend,
  env: NodeJS.ProcessEnv = {},
): Promise<INestApplication> {
  const originalEnv = process.env;
  process.env = {
    ...originalEnv,
    ...STACK_ENV,
    DISMISSIBLE_STORAGE_TYPE: storage,
    DISMISSIBLE_CACHE_TYPE: cache === 'none' ? '' : cache,
    ...env,
  };

  try {
    return await createTestApp({
      moduleOptions: { configPath: join(__dirname, '../../config'), logger: NullLogger },
    });
  } finally {
    process.env = originalEnv;
  }
}

/**
 * The services outlive a test run, so every test uses its own ids rather than clearing shared data.
 */
export function uniqueId(prefix: string): string {
  return `${prefix}-${randomUUID()}`;
}
