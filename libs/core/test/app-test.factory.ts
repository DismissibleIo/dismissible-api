import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DismissibleModule, IDismissibleModuleOptions } from '../src/dismissible.module';
import { MemoryStorageAdapter, DISMISSIBLE_STORAGE_ADAPTER } from '@dismissible/nestjs-storage';
import { ValidationPipe } from '@nestjs/common';

export type TestAppOptions = {
  moduleOptions?: IDismissibleModuleOptions;
  customize?: (builder: TestingModuleBuilder) => TestingModuleBuilder;
};

export async function createTestApp(options?: TestAppOptions): Promise<INestApplication> {
  let builder = Test.createTestingModule({
    imports: [DismissibleModule.forRoot(options?.moduleOptions || {})],
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

  // Apply validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  return app;
}

export async function cleanupTestData(app: INestApplication): Promise<void> {
  const storage = app.get<MemoryStorageAdapter>(DISMISSIBLE_STORAGE_ADAPTER);
  await storage.deleteAll();
}
