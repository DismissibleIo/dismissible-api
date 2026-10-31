import { Injectable, Inject } from '@nestjs/common';
import { DISMISSIBLE_LOGGER, IDismissibleLogger } from '@dismissible/nestjs-logger';
import { IDismissibleStorage } from '@dismissible/nestjs-storage';
import { DismissibleItemDto, DismissibleItemFactory } from '@dismissible/nestjs-item';
import { PrismaService } from './prisma.service';

/**
 * PostgreSQL storage adapter for dismissible items using Prisma.
 * Implements IDismissibleStorage for persistent database storage.
 */
@Injectable()
export class PostgresStorageAdapter implements IDismissibleStorage {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(DISMISSIBLE_LOGGER) private readonly logger: IDismissibleLogger,
    private readonly itemFactory: DismissibleItemFactory,
  ) {}

  async get(userId: string, itemId: string): Promise<DismissibleItemDto | null> {
    this.logger.debug('PostgreSQL storage get', { userId, itemId });

    const item = await this.prisma.dismissibleItem.findUnique({
      where: {
        userId_id: {
          userId,
          id: itemId,
        },
      },
    });

    if (!item) {
      this.logger.debug('PostgreSQL storage miss', { userId, itemId });
      return null;
    }

    this.logger.debug('PostgreSQL storage hit', { userId, itemId });

    return this.mapToDto(item);
  }

  async getMany(userId: string, itemIds: string[]): Promise<Map<string, DismissibleItemDto>> {
    this.logger.debug('PostgreSQL storage getMany', { userId, itemCount: itemIds.length });

    const items = await this.prisma.dismissibleItem.findMany({
      where: {
        userId,
        id: { in: itemIds },
      },
    });

    const result = new Map<string, DismissibleItemDto>();
    for (const item of items) {
      result.set(item.id, this.mapToDto(item));
    }

    this.logger.debug('PostgreSQL storage getMany complete', {
      userId,
      requested: itemIds.length,
      found: result.size,
    });

    return result;
  }

  async create(item: DismissibleItemDto): Promise<DismissibleItemDto> {
    this.logger.debug('PostgreSQL storage create', { userId: item.userId, itemId: item.id });

    const [created] = await this.createMany([item]);

    return created;
  }

  async createMany(items: DismissibleItemDto[]): Promise<DismissibleItemDto[]> {
    this.logger.debug('PostgreSQL storage createMany', { itemCount: items.length });

    if (items.length === 0) {
      return [];
    }

    const { count } = await this.prisma.dismissibleItem.createMany({
      data: items.map((item) => ({
        id: item.id,
        userId: item.userId,
        createdAt: item.createdAt,
        dismissedAt: item.dismissedAt ?? null,
      })),
      skipDuplicates: true,
    });

    this.logger.debug('PostgreSQL storage createMany complete', { created: count });

    // Prisma createMany doesn't return the created records, so we return the input items
    // The items already have all the data we need since they were constructed by the factory
    if (count === items.length) {
      return items;
    }

    // A concurrent request created some of the items first, so those stored items win
    const stored = await this.getMany(
      items[0].userId,
      items.map((item) => item.id),
    );
    return items.map((item) => stored.get(item.id) ?? item);
  }

  async update(item: DismissibleItemDto): Promise<DismissibleItemDto> {
    this.logger.debug('PostgreSQL storage update', { userId: item.userId, itemId: item.id });

    const updated = await this.prisma.dismissibleItem.update({
      where: {
        userId_id: {
          userId: item.userId,
          id: item.id,
        },
      },
      data: {
        dismissedAt: item.dismissedAt ?? null,
      },
    });

    return this.mapToDto(updated);
  }

  async delete(userId: string, itemId: string): Promise<void> {
    this.logger.debug('PostgreSQL storage delete', { userId, itemId });

    await this.prisma.dismissibleItem.delete({
      where: {
        userId_id: {
          userId,
          id: itemId,
        },
      },
    });
  }

  async deleteAll(): Promise<void> {
    this.logger.debug('PostgreSQL storage deleteAll');
    await this.prisma.dismissibleItem.deleteMany({});
  }

  /**
   * Map a Prisma model to a DismissibleItemDto.
   */
  private mapToDto(item: {
    id: string;
    userId: string;
    createdAt: Date;
    dismissedAt: Date | null;
  }): DismissibleItemDto {
    return this.itemFactory.create({
      id: item.id,
      userId: item.userId,
      createdAt: item.createdAt,
      dismissedAt: item.dismissedAt ?? undefined,
    });
  }
}
