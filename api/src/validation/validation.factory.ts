import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ValidationConfig } from './validation.config';
import { DISMISSIBLE_LOGGER, IDismissibleLogger } from '@dismissible/nestjs-logger';

export function configureAppWithValidation(app: INestApplication) {
  const logger = app.get<IDismissibleLogger>(DISMISSIBLE_LOGGER);
  const validationConfig = app.get(ValidationConfig);

  logger.log('Registering ValidationPipe', { validationConfig });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: validationConfig.whitelist ?? true,
      forbidNonWhitelisted: validationConfig.forbidNonWhitelisted ?? true,
      transform: validationConfig.transform ?? true,
      disableErrorMessages: validationConfig.disableErrorMessages ?? true,
    }),
  );
}
