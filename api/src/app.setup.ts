import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import fastifyHelmet from '@fastify/helmet';
import { SwaggerConfig, configureAppWithSwagger } from './swagger';
import { CorsConfig } from './cors';
import { HelmetConfig } from './helmet';
import { ValidationConfig } from './validation';

export async function configureApp(app: INestApplication): Promise<void> {
  const fastifyApp = app as NestFastifyApplication;

  const helmetConfig = app.get(HelmetConfig);
  if (helmetConfig.enabled) {
    await fastifyApp.register(fastifyHelmet, {
      contentSecurityPolicy: helmetConfig.contentSecurityPolicy ?? true,
      crossOriginEmbedderPolicy: helmetConfig.crossOriginEmbedderPolicy ?? true,
      hsts: {
        maxAge: helmetConfig.hstsMaxAge ?? 31536000,
        includeSubDomains: helmetConfig.hstsIncludeSubDomains ?? true,
        preload: helmetConfig.hstsPreload ?? false,
      },
    });
  }

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
  }

  const validationConfig = app.get(ValidationConfig);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: validationConfig.whitelist ?? true,
      forbidNonWhitelisted: validationConfig.forbidNonWhitelisted ?? true,
      transform: validationConfig.transform ?? true,
      disableErrorMessages: validationConfig.disableErrorMessages ?? true,
    }),
  );

  const swaggerConfig = app.get(SwaggerConfig);
  configureAppWithSwagger(app, swaggerConfig);
}
