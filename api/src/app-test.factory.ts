import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule, AppModuleOptions } from './app.module';
import { configureApp } from './app.setup';
import { DISMISSIBLE_STORAGE_ADAPTER, IDismissibleStorage } from '@dismissible/nestjs-storage';

export type TestAppOptions = {
  moduleOptions?: AppModuleOptions;
  customize?: (builder: TestingModuleBuilder) => TestingModuleBuilder;
};

export async function createTestApp(options?: TestAppOptions): Promise<INestApplication> {
  let builder = Test.createTestingModule({
    imports: [AppModule.forRoot(options?.moduleOptions)],
  });

  if (options?.customize) {
    builder = options.customize(builder);
  }

  const moduleFixture = await builder.compile();
  const app = moduleFixture.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter({
      bodyLimit: 10 * 1024, // 10kb
    }),
  );

  app.useLogger(false);

  await configureApp(app);
  await app.init();

  await app.getHttpAdapter().getInstance().ready();

  return app;
}

export async function cleanupTestData(app: INestApplication): Promise<void> {
  const storage = app.get<IDismissibleStorage>(DISMISSIBLE_STORAGE_ADAPTER);
  await storage.deleteAll();
}
