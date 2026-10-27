import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import {
  type ExecutionContext,
  type INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { type TypeId } from '@devpulse/lib';

import { ApiKeyGuard } from '../../api-keys/guards/api-key.guard';
import { ScopesGuard } from '../../api-keys/guards/scopes.guard';
import { type ProjectSummaryDto } from '../../projects/dto/response/project-summary.dto';
import { ProjectsService } from '../../projects/services/projects.service';
import { getHttpServer } from '../../test/get-http-server';
import { User } from '../../users/entities/user.entity';
import { type GetIntegrationSessionItemDto } from '../dto/response/get-integration-sessions-response.dto';
import { IntegrationsAnalyticsService } from '../services/integrations-analytics.service';

import { IntegrationsAnalyticsController } from './integrations-analytics.controller';

describe('IntegrationsAnalyticsController (Integration)', () => {
  let app: INestApplication;

  const mockUser = Object.assign(new User(), {
    id: 'u_user123',
    email: 'api@devpulse.io',
    isActive: true,
  });

  const mockSessionItem: GetIntegrationSessionItemDto = {
    id: 'ws_123',
    projectName: 'DevPulse Core',
    gitBranch: 'main',
    startedAt: new Date('2026-03-30T10:00:00.000Z'),
    endedAt: new Date('2026-03-30T11:00:00.000Z'),
    durationSeconds: 3600,
    focusScore: 95,
    earnedMoney: 60.5,
  };

  const mockProjectItem: ProjectSummaryDto = {
    id: 'p_123',
    name: 'DevPulse Core',
    remote: 'https://github.com/devpulse/core.git',
    activeTime: '1h 0m',
    focusScore: 90,
    sessions: 5,
    lastActive: '2026-03-30T12:00:00.000Z',
    totalCommits: 10,
    totalCommands: 42,
    languages: [],
    branches: [],
    recentSessions: [],
  };

  const mockIntegrationsService = {
    getRecentSessions: jest.fn((_userId: TypeId<'users'>, _limit: number) =>
      Promise.resolve([mockSessionItem]),
    ),
  };

  const mockProjectsService = {
    getUserProjects: jest.fn((_userId: TypeId<'users'>) => Promise.resolve([mockProjectItem])),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [IntegrationsAnalyticsController],
      providers: [
        {
          provide: IntegrationsAnalyticsService,
          useValue: mockIntegrationsService,
        },
        {
          provide: ProjectsService,
          useValue: mockProjectsService,
        },
      ],
    })
      .overrideGuard(ApiKeyGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest<{
            headers: { 'x-api-key'?: string };
            user?: User;
          }>();

          if (req.headers['x-api-key'] === 'valid-api-key') {
            req.user = mockUser;
            return true;
          }
          throw new UnauthorizedException('Invalid API Key');
        },
      })
      .overrideGuard(ScopesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 401 when API key is missing', async () => {
    const response = await request(getHttpServer(app)).get('/integrations/analytics/ping');

    expect(response.status).toBe(401);
  });

  it('should return 200 and success message on ping with valid API key', async () => {
    const response = await request(getHttpServer(app))
      .get('/integrations/analytics/ping')
      .set('x-api-key', 'valid-api-key');

    const body = response.body as { success: boolean; userId: string };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.userId).toBe('u_user123');
  });

  it('should parse limit query param and bound it to maximum of 50', async () => {
    const response = await request(getHttpServer(app))
      .get('/integrations/analytics/sessions?limit=999')
      .set('x-api-key', 'valid-api-key');

    const body = response.body as Array<GetIntegrationSessionItemDto>;

    expect(response.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(mockIntegrationsService.getRecentSessions).toHaveBeenCalledWith('u_user123', 50);
  });

  it('should return 200 and user projects list', async () => {
    const response = await request(getHttpServer(app))
      .get('/integrations/analytics/projects')
      .set('x-api-key', 'valid-api-key');

    const body = response.body as Array<ProjectSummaryDto>;

    expect(response.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0]?.id).toBe('p_123');
    expect(mockProjectsService.getUserProjects).toHaveBeenCalledWith('u_user123');
  });
});
