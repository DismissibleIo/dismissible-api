import { Injectable, Inject, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis, { RedisOptions } from 'ioredis';
import { DISMISSIBLE_LOGGER, IDismissibleLogger } from '@dismissible/nestjs-logger';
import { RedisCacheConfig, DISMISSIBLE_REDIS_CACHE_CONFIG } from './redis-cache.config';

const DEFAULT_CONNECTION_TIMEOUT_MS = 5000;

/**
 * Service for managing Redis connection.
 * Handles connection lifecycle and provides Redis client instance.
 */
@Injectable()
export class RedisClientService implements OnModuleInit, OnModuleDestroy {
  private readonly client: Redis;

  constructor(
    @Inject(DISMISSIBLE_REDIS_CACHE_CONFIG) private readonly config: RedisCacheConfig,
    @Inject(DISMISSIBLE_LOGGER) private readonly logger: IDismissibleLogger,
  ) {
    const redisOptions: RedisOptions = {
      enableReadyCheck: config.enableReadyCheck ?? true,
      maxRetriesPerRequest: config.maxRetriesPerRequest ?? 3,
      connectTimeout: config.connectionTimeoutMs ?? DEFAULT_CONNECTION_TIMEOUT_MS,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        this.logger.debug(`Redis retry attempt ${times}`, { delay });
        return delay;
      },
    };

    this.client = new Redis(config.url, redisOptions);

    this.client.on('connect', () => {
      this.logger.debug('Redis client connecting');
    });

    this.client.on('ready', () => {
      this.logger.log('Redis client ready');
    });

    this.client.on('error', (error) => {
      this.logger.error('Redis client error', { error: error.message });
    });

    this.client.on('close', () => {
      this.logger.debug('Redis client connection closed');
    });
  }

  getClient(): Redis {
    return this.client;
  }

  async onModuleInit(): Promise<void> {
    this.logger.debug('Connecting to Redis server');

    try {
      await this.waitForConnection();
      const result = await this.client.ping();

      if (result !== 'PONG') {
        throw new Error('Redis PING command did not return PONG');
      }

      this.logger.debug('Connected to Redis server');
    } catch (error) {
      this.logger.error('Failed to connect to Redis server', error);

      // Extract meaningful error message
      let errorMessage = 'Unknown error';
      if (error instanceof AggregateError && error.errors.length > 0) {
        errorMessage = error.errors[0].message || error.message || 'Connection failed';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      throw new Error(
        `Redis connection failed: ${errorMessage}. ` +
          'Ensure Redis is running and DISMISSIBLE_CACHE_REDIS_URL is configured correctly.',
      );
    }
  }

  /**
   * Wait for Redis client to reach 'ready' state or timeout.
   * This ensures the connection is established before proceeding.
   */
  private async waitForConnection(): Promise<void> {
    const timeout = this.config.connectionTimeoutMs ?? DEFAULT_CONNECTION_TIMEOUT_MS;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Redis connection timeout after ${timeout}ms`));
      }, timeout);

      // If already connected, resolve immediately
      if (this.client.status === 'ready') {
        clearTimeout(timeoutId);
        resolve();
        return;
      }

      // Wait for ready event
      const onReady = () => {
        clearTimeout(timeoutId);
        this.client.off('error', onError);
        resolve();
      };

      const onError = (error: Error) => {
        clearTimeout(timeoutId);
        this.client.off('ready', onReady);
        reject(error);
      };

      this.client.once('ready', onReady);
      this.client.once('error', onError);
    });
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.debug('Disconnecting Redis client');
    await this.client.quit();
  }
}
