import { NestFastifyApplication } from '@nestjs/platform-fastify';
import fastifyHelmet from '@fastify/helmet';
import { HelmetConfig } from './helmet.config';
import { DISMISSIBLE_LOGGER, IDismissibleLogger } from '@dismissible/nestjs-logger';

export async function configureAppWithHelmet(app: NestFastifyApplication) {
  const logger = app.get<IDismissibleLogger>(DISMISSIBLE_LOGGER);
  const helmetConfig = app.get(HelmetConfig);

  if (helmetConfig.enabled) {
    await app.register(fastifyHelmet, {
      contentSecurityPolicy: helmetConfig.contentSecurityPolicy ?? true,
      crossOriginEmbedderPolicy: helmetConfig.crossOriginEmbedderPolicy ?? true,
      hsts: {
        maxAge: helmetConfig.hstsMaxAge ?? 31536000,
        includeSubDomains: helmetConfig.hstsIncludeSubDomains ?? true,
        preload: helmetConfig.hstsPreload ?? false,
      },
    });
    logger.log('Helmet is enabled', { helmetConfig });
  } else {
    logger.log('Helmet is disabled');
  }
}
