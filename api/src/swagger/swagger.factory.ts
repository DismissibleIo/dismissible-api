import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerDocumentOptions, SwaggerModule } from '@nestjs/swagger';
import { SwaggerConfig } from './swagger.config';
import { DISMISSIBLE_LOGGER, IDismissibleLogger } from '@dismissible/nestjs-logger';

const swaggerDocumentOptions: SwaggerDocumentOptions = {
  operationIdFactory: (_controllerKey: string, methodKey: string) => methodKey,
};

export function configureAppWithSwagger(app: INestApplication) {
  const logger = app.get<IDismissibleLogger>(DISMISSIBLE_LOGGER);
  const swaggerConfig = app.get(SwaggerConfig);

  if (swaggerConfig.enabled) {
    logger.log('Swagger is enabled', { swaggerConfig });
    const { path = 'docs' } = swaggerConfig;

    const config = new DocumentBuilder()
      .setTitle('Dismissible')
      .setDescription('An API to handle dismissible items for users')
      .setVersion('1.0')
      .build();

    const documentFactory = () => SwaggerModule.createDocument(app, config, swaggerDocumentOptions);
    SwaggerModule.setup(path, app, documentFactory, {
      useGlobalPrefix: true,
    });
  } else {
    logger.log('Swagger is disabled');
  }
}
