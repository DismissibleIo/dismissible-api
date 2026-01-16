import { INestApplication } from '@nestjs/common';
import { configureAppWithSwagger } from './swagger';
import { configureAppWithCors } from './cors';
import { configureAppWithHelmet } from './helmet';
import { configureAppWithValidation } from './validation';
import { DISMISSIBLE_LOGGER, IDismissibleLogger } from '@dismissible/nestjs-logger';

export async function configureApp(app: INestApplication): Promise<void> {
  const logger = app.get<IDismissibleLogger>(DISMISSIBLE_LOGGER);
  app.useLogger(logger);
  logger.log('Configuring application');

  await configureAppWithHelmet(app);
  configureAppWithCors(app);
  configureAppWithValidation(app);
  configureAppWithSwagger(app);
}
