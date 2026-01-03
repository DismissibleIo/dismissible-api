import { INestApplication } from '@nestjs/common';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import fastifyHelmet from '@fastify/helmet';
import { HelmetConfig } from './helmet.config';
import { DISMISSIBLE_LOGGER, IDismissibleLogger } from '@dismissible/nestjs-logger';

export async function configureAppWithHelmet(app: INestApplication) {
  const logger = app.get<IDismissibleLogger>(DISMISSIBLE_LOGGER);
  logger.setContext('Helmet');
  const helmetConfig = app.get(HelmetConfig);

  if (helmetConfig.enabled) {
    const fastifyApp = app as NestFastifyApplication;
    await fastifyApp.register(fastifyHelmet, {
      contentSecurityPolicy: helmetConfig.contentSecurityPolicy ?? true,
      crossOriginEmbedderPolicy: helmetConfig.crossOriginEmbedderPolicy ?? true,
      hsts: {
        maxAge: helmetConfig.hstsMaxAge ?? 31536000,
        includeSubDomains: helmetConfig.hstsIncludeSubDomains ?? true,
        preload: helmetConfig.hstsPreload ?? false,
      },
    });
    logger.info('Helmet is enabled', { helmetConfig });
  } else {
    logger.info('Helmet is disabled');
  }
}
