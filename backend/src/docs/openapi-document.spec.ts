import { describe, expect, it } from '@jest/globals';
import { type OpenAPIObject } from '@nestjs/swagger';

import {
  addPublicErrorResponses,
  addResponseEnvelopes,
  retainPublicIntegrationPaths,
} from './openapi-document';

interface TestResponseObject {
  content?: Record<string, { example?: unknown }>;
}

function createDocument(): OpenAPIObject {
  return {
    openapi: '3.0.0',
    info: { title: 'Test', version: '1' },
    paths: {
      '/api/v1/integrations/analytics/hot-files': {
        get: {
          responses: {
            200: {
              description: 'Success',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      totalAttributedSeconds: { type: 'number', example: 120 },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1/analytics/hot-files': {
        get: { responses: { 200: { description: 'Success' } } },
      },
    },
    components: {},
  };
}

describe('OpenAPI document helpers', () => {
  it('keeps only integration endpoints in the public document', () => {
    const document = createDocument();

    retainPublicIntegrationPaths(document);

    expect(Object.keys(document.paths)).toEqual(['/api/v1/integrations/analytics/hot-files']);
  });

  it('wraps successful response examples with the actual endpoint path', () => {
    const document = createDocument();

    addResponseEnvelopes(document);

    const operation = document.paths['/api/v1/integrations/analytics/hot-files'].get;
    if (!operation) throw new Error('Expected GET operation');
    const response = operation.responses[200] as TestResponseObject;
    const json = response.content?.['application/json'];

    expect(json?.example).toEqual({
      success: true,
      data: { totalAttributedSeconds: 120 },
      timestamp: '2026-11-04T09:00:00.000Z',
      path: '/api/v1/integrations/analytics/hot-files',
    });
  });

  it('adds the standard public error responses', () => {
    const document = createDocument();

    addPublicErrorResponses(document);

    const operation = document.paths['/api/v1/integrations/analytics/hot-files'].get;
    if (!operation) throw new Error('Expected GET operation');
    const { responses } = operation;

    expect(responses[400]).toBeDefined();
    expect(responses[401]).toBeDefined();
    expect(responses[403]).toBeDefined();
    expect(responses[429]).toBeDefined();
  });
});
