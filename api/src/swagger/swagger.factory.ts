import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerDocumentOptions, SwaggerModule } from '@nestjs/swagger';
import { SwaggerConfig } from './swagger.config';

const swaggerDocumentOptions: SwaggerDocumentOptions = {
  operationIdFactory: (_controllerKey: string, methodKey: string) => methodKey,
};

export function configureAppWithSwagger(app: INestApplication, swaggerConfig: SwaggerConfig) {
  if (swaggerConfig.enabled) {
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
  }
}
