import { BadRequestException, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, type OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { env } from '@devpulse/env/api';

import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  const corsOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.use(cookieParser());

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        console.error('Validation errors:', JSON.stringify(errors, null, 2));

        return new BadRequestException(errors);
      },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('DevPulse API')
    .setDescription('DevPulse API documentation for integration endpoints')
    .setVersion('1.0')
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'DevPulse API key',
      },
      'ApiKeyAuth',
    )
    .build();

  const documentFactory = (): OpenAPIObject => {
    const document = SwaggerModule.createDocument(app, swaggerConfig);

    const filteredPaths: Record<string, unknown> = {};
    for (const [path, pathItem] of Object.entries(document.paths)) {
      if (path.startsWith('/integrations/')) {
        filteredPaths[path] = pathItem;
      }
    }
    document.paths = filteredPaths as typeof document.paths;

    return document;
  };

  const httpAdapter = app.getHttpAdapter();
  const expressApp = httpAdapter.getInstance() as {
    get: (path: string, handler: (req: unknown, res: unknown) => void) => void;
  };
  expressApp.get('/api/v1/docs-json', (req: unknown, res: unknown) => {
    const document = documentFactory();
    (res as { json: (data: unknown) => void }).json(document);
  });

  await app.listen(env.PORT);
}

void bootstrap();
