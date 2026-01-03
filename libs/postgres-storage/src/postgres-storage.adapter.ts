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

  async create(item: DismissibleItemDto): Promise<DismissibleItemDto> {
    this.logger.debug('PostgreSQL storage create', { userId: item.userId, itemId: item.id });

    const created = await this.prisma.dismissibleItem.create({
      data: {
        id: item.id,
        userId: item.userId,
        createdAt: item.createdAt,
        dismissedAt: item.dismissedAt ?? null,
      },
    });

    return this.mapToDto(created);
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
