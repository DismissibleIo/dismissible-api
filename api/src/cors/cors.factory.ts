import { INestApplication } from '@nestjs/common';
import { CorsConfig } from './cors.config';
import { DISMISSIBLE_LOGGER, IDismissibleLogger } from '@dismissible/nestjs-logger';

export function configureAppWithCors(app: INestApplication) {
  const logger = app.get<IDismissibleLogger>(DISMISSIBLE_LOGGER);
  logger.setContext('CORS');
  const corsConfig = app.get(CorsConfig);

  if (corsConfig.enabled) {
    app.enableCors({
      origin: corsConfig.origins ?? ['http://localhost:3001', 'http://localhost:5173'],
      methods: corsConfig.methods ?? ['GET', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: corsConfig.allowedHeaders ?? [
        'Content-Type',
        'Authorization',
        'x-request-id',
      ],
      credentials: corsConfig.credentials ?? true,
      maxAge: corsConfig.maxAge ?? 86400,
    });
    logger.info('CORS is enabled', { corsConfig });
  } else {
    logger.info('CORS is disabled');
  }
}
