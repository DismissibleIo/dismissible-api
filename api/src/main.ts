import { DismissibleNestFactory } from './dismissible-nest-factory';

async function bootstrap() {
  const app = await DismissibleNestFactory.create();
  await app.start();
}

bootstrap();
