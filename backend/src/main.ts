import { BadRequestException, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, type OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import type { Request, Response } from 'express';
import helmet from 'helmet';

import { env } from '@devpulse/env/api';

import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AppModule } from './app.module';

type OpenApiRecord = Record<string, unknown>;

const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete']);

function asRecord(value: unknown): OpenApiRecord | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as OpenApiRecord)
    : undefined;
}

function getSchemaExample(
  schema: unknown,
  schemas: OpenApiRecord,
  visited = new Set<string>(),
): unknown {
  const record = asRecord(schema);
  if (!record) return undefined;
  if (record.example !== undefined) return record.example;

  const ref = record.$ref;
  if (typeof ref === 'string' && ref.startsWith('#/components/schemas/')) {
    const name = ref.slice('#/components/schemas/'.length);
    if (visited.has(name)) return undefined;
    visited.add(name);
    return getSchemaExample(schemas[name], schemas, visited);
  }

  if (Array.isArray(record.enum) && record.enum.length > 0) return record.enum[0];
  if (record.type === 'array') {
    const item = getSchemaExample(record.items, schemas, visited);
    return item === undefined ? [] : [item];
  }

  const properties = asRecord(record.properties);
  if (properties) {
    return Object.fromEntries(
      Object.entries(properties).flatMap(([key, property]) => {
        const value = getSchemaExample(property, schemas, new Set(visited));
        return value === undefined ? [] : [[key, value]];
      }),
    );
  }

  if (record.type === 'boolean') return true;
  if (record.type === 'integer' || record.type === 'number') return 0;
  if (record.format === 'date-time') return '2026-01-01T00:00:00.000Z';
  if (record.format === 'date') return '2026-01-01';
  if (record.type === 'string') return 'string';

  return undefined;
}

function addResponseEnvelopes(document: OpenAPIObject): void {
  const documentRecord = document as unknown as OpenApiRecord;
  const components = (documentRecord.components ??= {}) as OpenApiRecord;
  const schemas = (components.schemas ??= {}) as OpenApiRecord;

  for (const pathItem of Object.values(document.paths)) {
    const item = asRecord(pathItem);
    if (!item) continue;

    for (const [method, value] of Object.entries(item)) {
      if (!HTTP_METHODS.has(method)) continue;
      const operation = asRecord(value);
      const responses = asRecord(operation?.responses);
      if (!responses) continue;

      for (const [status, value] of Object.entries(responses)) {
        if (!status.startsWith('2')) continue;
        const response = asRecord(value);
        if (!response) continue;
        const content = asRecord(response.content);
        const json = content ? asRecord(content['application/json']) : undefined;
        if (!content || !json) continue;
        const dataSchema = json.schema ?? {};

        json.schema = {
          type: 'object',
          required: ['success', 'data', 'timestamp', 'path'],
          properties: {
            success: { type: 'boolean', example: true },
            data: dataSchema,
            timestamp: { type: 'string', format: 'date-time' },
            path: { type: 'string' },
          },
        };
        json.example = {
          success: true,
          data: getSchemaExample(dataSchema, schemas),
          timestamp: '2026-11-04T09:00:00.000Z',
          path: '/api/v1/integrations/analytics/status',
        };
        content['application/json'] = json;
        response.content = content;
      }
    }
  }
}

function addPublicErrorResponses(document: OpenAPIObject): void {
  const errorSchema = {
    type: 'object',
    required: ['success', 'error', 'timestamp', 'path'],
    properties: {
      success: { type: 'boolean', example: false },
      error: {
        type: 'object',
        required: ['code', 'message'],
        properties: {
          code: { type: 'number', example: 401 },
          message: { type: 'string', example: 'Invalid API key' },
          details: {},
        },
      },
      timestamp: { type: 'string', format: 'date-time' },
      path: { type: 'string' },
    },
  };

  for (const pathItem of Object.values(document.paths)) {
    const item = asRecord(pathItem);
    if (!item) continue;

    for (const [method, value] of Object.entries(item)) {
      if (!HTTP_METHODS.has(method)) continue;
      const operation = asRecord(value);
      if (!operation) continue;
      const responses = (operation.responses ??= {}) as OpenApiRecord;

      for (const [status, description, message] of [
        ['400', 'Invalid request parameters', 'Validation failed'],
        ['401', 'Missing or invalid API key', 'Invalid API key'],
        ['403', 'API key does not have the required scope', 'Insufficient API key scope'],
        ['429', 'Rate limit exceeded', 'ThrottlerException: Too Many Requests'],
      ]) {
        responses[status] = {
          description,
          content: {
            'application/json': {
              schema: errorSchema,
              example: {
                success: false,
                error: { code: Number(status), message },
                timestamp: '2026-11-04T09:00:00.000Z',
                path: '/api/v1/integrations/analytics/status',
              },
            },
          },
        };
      }
    }
  }
}

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
      forbidNonWhitelisted: false,
      transform: true,
      exceptionFactory: (errors) => {
        console.error('Validation errors:', JSON.stringify(errors, null, 2));
        return new BadRequestException(errors);
      },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('DevPulse API')
    .setDescription('DevPulse API documentation')
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
    .addBearerAuth()
    .build();

  const publicDocumentFactory = (): OpenAPIObject => {
    const document = SwaggerModule.createDocument(app, swaggerConfig);

    const filteredPaths: Record<string, unknown> = {};
    for (const [path, pathItem] of Object.entries(document.paths)) {
      if (path.includes('/integrations/')) {
        filteredPaths[path] = pathItem;
      }
    }
    document.paths = filteredPaths as typeof document.paths;
    addResponseEnvelopes(document);
    addPublicErrorResponses(document);

    return document;
  };

  const fullDocumentFactory = (): OpenAPIObject => {
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    addResponseEnvelopes(document);
    return document;
  };

  const httpAdapter = app.getHttpAdapter();
  const expressApp = httpAdapter.getInstance() as {
    get: (path: string, handler: (req: Request, res: Response) => void) => void;
  };

  expressApp.get('/api/v1/docs-json', (req, res) => {
    res.json(publicDocumentFactory());
  });

  expressApp.get('/api/v1/dev-docs-json', (req, res) => {
    res.json(fullDocumentFactory());
  });

  SwaggerModule.setup('api/v1/dev-docs', app, fullDocumentFactory);

  await app.listen(env.PORT);
}

void bootstrap();
