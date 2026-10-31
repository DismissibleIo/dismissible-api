import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule, AppModuleOptions } from './app.module';
import { ServerConfig } from './server/server.config';
import { configureApp } from './app.setup';
import { DISMISSIBLE_LOGGER } from '@dismissible/nestjs-logger';

export interface IDismissibleNestApplication {
  getNestApplication(): INestApplication;
  start(): Promise<void>;
}

export type IDismissibleNestFactoryOptions = AppModuleOptions;

class DismissibleNestApplication implements IDismissibleNestApplication {
  constructor(private readonly app: NestFastifyApplication) {}

  async start(): Promise<void> {
    const serverConfig = this.app.get(ServerConfig);
    const logger = this.app.get(DISMISSIBLE_LOGGER);
    const port = serverConfig.port ?? 3000;
    await this.app.listen(port, '0.0.0.0');
    logger.log(`🚀 Application is running on: http://localhost:${port}`);
  }

  getNestApplication(): INestApplication {
    return this.app;
  }
}

export class DismissibleNestFactory {
  static async create(
    options?: IDismissibleNestFactoryOptions,
  ): Promise<IDismissibleNestApplication> {
    const app = await NestFactory.create<NestFastifyApplication>(
      AppModule.forRoot(options),
      new FastifyAdapter({
        bodyLimit: 10 * 1024, // 10kb
      }),
    );
    await configureApp(app);

    return new DismissibleNestApplication(app);
  }
}
