import { Injectable, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { PrismaClient } from '../prisma/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { DISMISSIBLE_LOGGER, IDismissibleLogger } from '@dismissible/nestjs-logger';
import { PostgresStorageConfig } from './postgres-storage.config';

/**
 * PrismaService wraps the PrismaClient and handles connection lifecycle.
 * It connects to the database on module initialization and disconnects on shutdown.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly pool: Pool;

  constructor(
    private readonly config: PostgresStorageConfig,
    @Inject(DISMISSIBLE_LOGGER) private readonly logger: IDismissibleLogger,
  ) {
    const pool = new Pool({ connectionString: config.connectionString });
    const adapter = new PrismaPg(pool);
    super({ adapter });
    this.pool = pool;
  }

  async onModuleInit(): Promise<void> {
    this.logger.debug('Connecting to PostgreSQL database');
    await this.$connect();

    try {
      await this.$queryRaw`SELECT 1`;
      this.logger.debug('Connected to PostgreSQL database');
    } catch (error) {
      this.logger.error('Failed to connect to PostgreSQL database', error);
      throw new Error(
        `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
          'Ensure PostgreSQL is running and DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING is configured correctly.',
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.debug('Disconnecting from PostgreSQL database');
    await this.$disconnect();
    await this.pool.end();
    this.logger.debug('Disconnected from PostgreSQL database');
  }
}
