import { INestApplication } from '@nestjs/common';
import { CorsConfig } from './cors.config';
import { DISMISSIBLE_LOGGER, IDismissibleLogger } from '@dismissible/nestjs-logger';

export function configureAppWithCors(app: INestApplication) {
  const logger = app.get<IDismissibleLogger>(DISMISSIBLE_LOGGER);
  logger.setContext('CORS');
  const corsConfig = app.get(CorsConfig);

  if (corsConfig.enabled) {
    // origins is guaranteed to be non-empty when enabled via @ValidateIf + @ArrayNotEmpty
    app.enableCors({
      origin: corsConfig.origins!,
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
