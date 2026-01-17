import { mock, Mock } from 'ts-jest-mocker';
import { PostgresStorageAdapter } from './postgres-storage.adapter';
import { PrismaService } from './prisma.service';
import { IDismissibleLogger } from '@dismissible/nestjs-logger';
import { DismissibleItemDto, DismissibleItemFactory } from '@dismissible/nestjs-item';

describe('PostgresStorageAdapter', () => {
  let adapter: PostgresStorageAdapter;
  let mockPrismaService: PrismaService;
  let mockLogger: Mock<IDismissibleLogger>;
  let mockItemFactory: DismissibleItemFactory;
  let mockDismissibleItem: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    createMany: jest.Mock;
    update: jest.Mock;
  };

  beforeEach(() => {
    mockLogger = mock<IDismissibleLogger>({ failIfMockNotProvided: false });

    mockItemFactory = new DismissibleItemFactory();

    mockDismissibleItem = {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
    };

    mockPrismaService = {
      dismissibleItem: mockDismissibleItem,
    } as unknown as PrismaService;

    adapter = new PostgresStorageAdapter(mockPrismaService, mockLogger, mockItemFactory);
  });

  describe('get', () => {
    it('should return null when item is not found', async () => {
      mockDismissibleItem.findUnique.mockResolvedValue(null);

      const result = await adapter.get('user-123', 'item-456');

      expect(result).toBeNull();
      expect(mockDismissibleItem.findUnique).toHaveBeenCalledWith({
        where: {
          userId_id: {
            userId: 'user-123',
            id: 'item-456',
          },
        },
      });
      expect(mockLogger.debug).toHaveBeenCalledWith('PostgreSQL storage miss', {
        userId: 'user-123',
        itemId: 'item-456',
      });
    });

    it('should return the item when found', async () => {
      const dbItem = {
        id: 'item-456',
        userId: 'user-123',
        createdAt: new Date('2024-01-15T10:30:00.000Z'),
        dismissedAt: null,
      };
      mockDismissibleItem.findUnique.mockResolvedValue(dbItem);

      const result = await adapter.get('user-123', 'item-456');

      expect(result).toEqual({
        id: 'item-456',
        userId: 'user-123',
        createdAt: new Date('2024-01-15T10:30:00.000Z'),
        dismissedAt: undefined,
      });
      expect(mockLogger.debug).toHaveBeenCalledWith('PostgreSQL storage hit', {
        userId: 'user-123',
        itemId: 'item-456',
      });
    });
  });

  describe('create', () => {
    it('should create a new item', async () => {
      const item: DismissibleItemDto = {
        id: 'item-456',
        userId: 'user-123',
        createdAt: new Date('2024-01-15T10:30:00.000Z'),
      };
      const dbItem = {
        id: 'item-456',
        userId: 'user-123',
        createdAt: new Date('2024-01-15T10:30:00.000Z'),
        dismissedAt: null,
      };
      mockDismissibleItem.create.mockResolvedValue(dbItem);

      const result = await adapter.create(item);

      expect(result).toEqual({
        id: 'item-456',
        userId: 'user-123',
        createdAt: new Date('2024-01-15T10:30:00.000Z'),
        dismissedAt: undefined,
      });
      expect(mockDismissibleItem.create).toHaveBeenCalledWith({
        data: {
          id: 'item-456',
          userId: 'user-123',
          createdAt: new Date('2024-01-15T10:30:00.000Z'),
          dismissedAt: null,
        },
      });
      expect(mockLogger.debug).toHaveBeenCalledWith('PostgreSQL storage create', {
        userId: 'user-123',
        itemId: 'item-456',
      });
    });
  });

  describe('update', () => {
    it('should update an existing item', async () => {
      const item: DismissibleItemDto = {
        id: 'item-456',
        userId: 'user-123',
        createdAt: new Date('2024-01-15T10:30:00.000Z'),
        dismissedAt: new Date('2024-01-15T12:00:00.000Z'),
      };
      const dbItem = {
        id: 'item-456',
        userId: 'user-123',
        createdAt: new Date('2024-01-15T10:30:00.000Z'),
        dismissedAt: new Date('2024-01-15T12:00:00.000Z'),
      };
      mockDismissibleItem.update.mockResolvedValue(dbItem);

      const result = await adapter.update(item);

      expect(result).toEqual({
        id: 'item-456',
        userId: 'user-123',
        createdAt: new Date('2024-01-15T10:30:00.000Z'),
        dismissedAt: new Date('2024-01-15T12:00:00.000Z'),
      });
      expect(mockDismissibleItem.update).toHaveBeenCalledWith({
        where: {
          userId_id: {
            userId: 'user-123',
            id: 'item-456',
          },
        },
        data: {
          dismissedAt: new Date('2024-01-15T12:00:00.000Z'),
        },
      });
      expect(mockLogger.debug).toHaveBeenCalledWith('PostgreSQL storage update', {
        userId: 'user-123',
        itemId: 'item-456',
      });
    });
  });

  describe('getMany', () => {
    it('should return empty map when no items found', async () => {
      mockDismissibleItem.findMany.mockResolvedValue([]);

      const result = await adapter.getMany('user-123', ['item-1', 'item-2']);

      expect(result.size).toBe(0);
      expect(mockDismissibleItem.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          id: { in: ['item-1', 'item-2'] },
        },
      });
    });

    it('should return map with found items', async () => {
      const dbItems = [
        {
          id: 'item-1',
          userId: 'user-123',
          createdAt: new Date('2024-01-15T10:30:00.000Z'),
          dismissedAt: null,
        },
        {
          id: 'item-2',
          userId: 'user-123',
          createdAt: new Date('2024-01-15T10:30:00.000Z'),
          dismissedAt: new Date('2024-01-15T12:00:00.000Z'),
        },
      ];
      mockDismissibleItem.findMany.mockResolvedValue(dbItems);

      const result = await adapter.getMany('user-123', ['item-1', 'item-2', 'item-3']);

      expect(result.size).toBe(2);
      expect(result.get('item-1')).toEqual({
        id: 'item-1',
        userId: 'user-123',
        createdAt: new Date('2024-01-15T10:30:00.000Z'),
        dismissedAt: undefined,
      });
      expect(result.get('item-2')).toEqual({
        id: 'item-2',
        userId: 'user-123',
        createdAt: new Date('2024-01-15T10:30:00.000Z'),
        dismissedAt: new Date('2024-01-15T12:00:00.000Z'),
      });
      expect(result.has('item-3')).toBe(false);
    });
  });

  describe('createMany', () => {
    it('should create multiple items', async () => {
      const items: DismissibleItemDto[] = [
        {
          id: 'item-1',
          userId: 'user-123',
          createdAt: new Date('2024-01-15T10:30:00.000Z'),
        },
        {
          id: 'item-2',
          userId: 'user-123',
          createdAt: new Date('2024-01-15T10:30:00.000Z'),
        },
      ];
      mockDismissibleItem.createMany.mockResolvedValue({ count: 2 });

      const result = await adapter.createMany(items);

      expect(result).toEqual(items);
      expect(mockDismissibleItem.createMany).toHaveBeenCalledWith({
        data: [
          {
            id: 'item-1',
            userId: 'user-123',
            createdAt: new Date('2024-01-15T10:30:00.000Z'),
            dismissedAt: null,
          },
          {
            id: 'item-2',
            userId: 'user-123',
            createdAt: new Date('2024-01-15T10:30:00.000Z'),
            dismissedAt: null,
          },
        ],
      });
    });

    it('should return empty array when creating empty array', async () => {
      const result = await adapter.createMany([]);

      expect(result).toEqual([]);
      expect(mockDismissibleItem.createMany).not.toHaveBeenCalled();
    });
  });
});
