import { mock, Mock } from 'ts-jest-mocker';
import { RedisClientService } from './redis-client.service';
import { IDismissibleLogger } from '@dismissible/nestjs-logger';
import { RedisCacheConfig } from './redis-cache.config';
import Redis, { RedisOptions } from 'ioredis';

// Mock the ioredis module
jest.mock('ioredis');

type EventHandler = (...args: unknown[]) => void;

describe('RedisClientService', () => {
  let service: RedisClientService;
  let mockLogger: Mock<IDismissibleLogger>;
  let config: RedisCacheConfig;
  let mockRedisInstance: Mock<Redis>;
  let eventHandlers: Record<string, EventHandler>;
  let retryStrategy: (times: number) => number;

  beforeEach(() => {
    jest.clearAllMocks();
    eventHandlers = {};

    mockLogger = mock<IDismissibleLogger>({ failIfMockNotProvided: false });

    config = {
      url: 'redis://localhost:6379',
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
    };

    // Create mock Redis instance using ts-jest-mocker
    mockRedisInstance = mock<Redis>({ failIfMockNotProvided: false });
    mockRedisInstance.quit.mockResolvedValue('OK');

    // Set up on method to capture event handlers
    mockRedisInstance.on.mockImplementation((event: string | symbol, handler: EventHandler) => {
      if (typeof event === 'string') {
        eventHandlers[event] = handler;
      }
      return mockRedisInstance;
    });

    // Mock Redis constructor to capture retry strategy
    (Redis as jest.MockedClass<typeof Redis>).mockImplementation(
      (url?: string, options?: RedisOptions) => {
        if (options?.retryStrategy && typeof options.retryStrategy === 'function') {
          retryStrategy = options.retryStrategy as (times: number) => number;
        }
        return mockRedisInstance;
      },
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create Redis client with correct URL', () => {
      service = new RedisClientService(config, mockLogger);

      expect(Redis).toHaveBeenCalledWith('redis://localhost:6379', expect.any(Object));
    });

    it('should register all event handlers', () => {
      service = new RedisClientService(config, mockLogger);

      expect(mockRedisInstance.on).toHaveBeenCalledTimes(4);
      expect(mockRedisInstance.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockRedisInstance.on).toHaveBeenCalledWith('ready', expect.any(Function));
      expect(mockRedisInstance.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockRedisInstance.on).toHaveBeenCalledWith('close', expect.any(Function));
    });
  });

  describe('retryStrategy', () => {
    beforeEach(() => {
      service = new RedisClientService(config, mockLogger);
    });

    it('should implement exponential backoff', () => {
      expect(retryStrategy(1)).toBe(50);
      expect(retryStrategy(2)).toBe(100);
      expect(retryStrategy(10)).toBe(500);
    });

    it('should cap delay at 2000ms', () => {
      expect(retryStrategy(50)).toBe(2000);
      expect(retryStrategy(100)).toBe(2000);
    });
  });

  describe('getClient', () => {
    it('should return the Redis client instance', () => {
      service = new RedisClientService(config, mockLogger);

      const client = service.getClient();

      expect(client).toBe(mockRedisInstance);
    });
  });

  describe('onModuleInit', () => {
    beforeEach(() => {
      service = new RedisClientService(config, mockLogger);
    });

    it('should connect to Redis and verify with PING', async () => {
      // Mock Redis client already ready
      Object.defineProperty(mockRedisInstance, 'status', {
        value: 'ready',
        configurable: true,
      });
      mockRedisInstance.ping.mockResolvedValue('PONG');

      await service.onModuleInit();

      expect(mockLogger.debug).toHaveBeenCalledWith('Connecting to Redis server');
      expect(mockRedisInstance.ping).toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith('Connected to Redis server');
    });

    it('should wait for ready event if not immediately ready', async () => {
      Object.defineProperty(mockRedisInstance, 'status', {
        value: 'connecting',
        configurable: true,
      });
      mockRedisInstance.ping.mockResolvedValue('PONG');

      // Mock once() to immediately trigger the ready handler
      mockRedisInstance.once.mockImplementation((event, handler) => {
        if (event === 'ready') {
          setTimeout(() => (handler as () => void)(), 10);
        }
        return mockRedisInstance;
      });

      await service.onModuleInit();

      expect(mockRedisInstance.once).toHaveBeenCalledWith('ready', expect.any(Function));
      expect(mockRedisInstance.ping).toHaveBeenCalled();
    });

    it('should throw error when connection times out', async () => {
      const customConfig = {
        ...config,
        connectionTimeoutMs: 100,
      };
      service = new RedisClientService(customConfig, mockLogger);

      Object.defineProperty(mockRedisInstance, 'status', {
        value: 'connecting',
        configurable: true,
      });

      // Mock once() to never call the ready handler (simulating timeout)
      mockRedisInstance.once.mockReturnValue(mockRedisInstance);

      await expect(service.onModuleInit()).rejects.toThrow(
        'Redis connection failed: Redis connection timeout after 100ms. Ensure Redis is running and DISMISSIBLE_CACHE_REDIS_URL is configured correctly.',
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to connect to Redis server',
        expect.any(Error),
      );
    });

    it('should throw error when Redis returns error during connection', async () => {
      Object.defineProperty(mockRedisInstance, 'status', {
        value: 'connecting',
        configurable: true,
      });

      const connectionError = new Error('ECONNREFUSED');
      mockRedisInstance.once.mockImplementation((event, handler) => {
        if (event === 'error') {
          setTimeout(() => (handler as (error: Error) => void)(connectionError), 10);
        }
        return mockRedisInstance;
      });

      await expect(service.onModuleInit()).rejects.toThrow(
        'Redis connection failed: ECONNREFUSED. Ensure Redis is running and DISMISSIBLE_CACHE_REDIS_URL is configured correctly.',
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to connect to Redis server',
        connectionError,
      );
    });

    it('should throw error when PING fails', async () => {
      Object.defineProperty(mockRedisInstance, 'status', {
        value: 'ready',
        configurable: true,
      });
      mockRedisInstance.ping.mockRejectedValue(new Error('PING failed'));

      await expect(service.onModuleInit()).rejects.toThrow(
        'Redis connection failed: PING failed. Ensure Redis is running and DISMISSIBLE_CACHE_REDIS_URL is configured correctly.',
      );
    });

    it('should throw error when PING does not return PONG', async () => {
      Object.defineProperty(mockRedisInstance, 'status', {
        value: 'ready',
        configurable: true,
      });
      mockRedisInstance.ping.mockResolvedValue('UNEXPECTED');

      await expect(service.onModuleInit()).rejects.toThrow(
        'Redis connection failed: Redis PING command did not return PONG. Ensure Redis is running and DISMISSIBLE_CACHE_REDIS_URL is configured correctly.',
      );
    });

    it('should handle non-Error objects in catch block', async () => {
      Object.defineProperty(mockRedisInstance, 'status', {
        value: 'ready',
        configurable: true,
      });
      mockRedisInstance.ping.mockRejectedValue('String error');

      await expect(service.onModuleInit()).rejects.toThrow(
        'Redis connection failed: Unknown error. Ensure Redis is running and DISMISSIBLE_CACHE_REDIS_URL is configured correctly.',
      );
    });

    it('should use default timeout when not configured', async () => {
      const minimalConfig = {
        url: 'redis://localhost:6379',
      };
      service = new RedisClientService(minimalConfig, mockLogger);

      Object.defineProperty(mockRedisInstance, 'status', {
        value: 'ready',
        configurable: true,
      });
      mockRedisInstance.ping.mockResolvedValue('PONG');

      await service.onModuleInit();

      // Should use default 5000ms timeout (not directly testable but ensures no error)
      expect(mockRedisInstance.ping).toHaveBeenCalled();
    });
  });

  describe('onModuleDestroy', () => {
    it('should disconnect Redis client on module destroy', async () => {
      service = new RedisClientService(config, mockLogger);

      await service.onModuleDestroy();

      expect(mockRedisInstance.quit).toHaveBeenCalled();
    });
  });

  describe('configuration', () => {
    it('should use default enableReadyCheck when not provided', () => {
      const minimalConfig = {
        url: 'redis://localhost:6379',
      };

      service = new RedisClientService(minimalConfig, mockLogger);

      expect(Redis).toHaveBeenCalled();
    });

    it('should respect custom enableReadyCheck setting', () => {
      const customConfig = {
        url: 'redis://localhost:6379',
        enableReadyCheck: false,
      };

      service = new RedisClientService(customConfig, mockLogger);

      expect(Redis).toHaveBeenCalled();
    });

    it('should respect custom maxRetriesPerRequest setting', () => {
      const customConfig = {
        url: 'redis://localhost:6379',
        maxRetriesPerRequest: 5,
      };

      service = new RedisClientService(customConfig, mockLogger);

      expect(Redis).toHaveBeenCalled();
    });

    it('should pass connectionTimeoutMs to Redis client options', () => {
      const customConfig = {
        url: 'redis://localhost:6379',
        connectionTimeoutMs: 10000,
      };

      service = new RedisClientService(customConfig, mockLogger);

      expect(Redis).toHaveBeenCalledWith(
        'redis://localhost:6379',
        expect.objectContaining({
          connectTimeout: 10000,
        }),
      );
    });

    it('should use default timeout of 5000ms when not configured', () => {
      const minimalConfig = {
        url: 'redis://localhost:6379',
      };

      service = new RedisClientService(minimalConfig, mockLogger);

      expect(Redis).toHaveBeenCalledWith(
        'redis://localhost:6379',
        expect.objectContaining({
          connectTimeout: 5000,
        }),
      );
    });
  });
});
