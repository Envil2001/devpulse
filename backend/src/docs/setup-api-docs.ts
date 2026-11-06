import { type INestApplication } from '@nestjs/common';
import { DocumentBuilder, type OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import {
  addPublicErrorResponses,
  addResponseEnvelopes,
  retainPublicIntegrationPaths,
} from './openapi-document';

interface ApiDocsOptions {
  exposeDevelopmentDocs: boolean;
}

export function setupApiDocs(app: INestApplication, options: ApiDocsOptions): void {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('DevPulse Public Integration API')
    .setDescription(
      'Read-only, API-first access to developer workflow analytics collected by DevPulse. This public contract exposes aggregated sessions, projects, files, branches, commands, and AI-assisted activity without source-code contents. VS Code telemetry ingestion and dashboard-only endpoints are intentionally excluded.',
    )
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

    retainPublicIntegrationPaths(document);
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
    get: (path: string, handler: (request: Request, response: Response) => void) => void;
  };

  expressApp.get('/api/v1/docs-json', (_request, response) => {
    response.json(publicDocumentFactory());
  });

  if (!options.exposeDevelopmentDocs) {
    return;
  }

  expressApp.get('/api/v1/dev-docs-json', (_request, response) => {
    response.json(fullDocumentFactory());
  });

  SwaggerModule.setup('api/v1/dev-docs', app, fullDocumentFactory);
}
