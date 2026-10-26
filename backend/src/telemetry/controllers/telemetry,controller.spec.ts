import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import {
  type ExecutionContext,
  type INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';

import { type TypeId } from '@devpulse/lib';

import { type GetIntegrationTodayResponseDto } from '../../analytics/dto/response/get-integration-today-response.dto';
import { IntegrationsAnalyticsService } from '../../analytics/services/integrations-analytics.service';
import { ApiKeyGuard } from '../../api-keys/guards/api-key.guard';
import { ScopesGuard } from '../../api-keys/guards/scopes.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { type AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { Project } from '../../projects/entities/project.entity';
import { getHttpServer } from '../../test/get-http-server';
import { User } from '../../users/entities/user.entity';
import { type TelemetryEventItemDto } from '../dto/request/ingest-telemetry-batch-request.dto';
import { type IngestTelemetryBatchResponseDto } from '../dto/response/ingest-telemetry-batch-response.dto';
import { type WorkSessionSummaryDto } from '../dto/response/work-session-summary.dto';
import { WorkSession, WorkSessionStatus } from '../entities/work-session.entity';
import { TelemetryQueue } from '../queue/telemetry.queue';

import { TelemetryController } from './telemetry.controller';

describe('TelemetryController (Integration)', () => {
  let app: INestApplication;

  const mockUserEntity = Object.assign(new User(), {
    id: 'u_user123',
    email: 'dev@devpulse.io',
    displayName: 'Dev User',
    timezone: 'UTC',
    hourlyRate: 60,
    currency: 'USD',
    isActive: true,
  });

  const mockAuthUser: AuthenticatedUser = {
    id: 'u_user123',
    email: 'dev@devpulse.io',
    displayName: 'Dev User',
    timezone: 'UTC',
    hourlyRate: 60,
    currency: 'USD',
  };

  const mockProject = Object.assign(new Project(), {
    id: 'p_core123',
    name: 'DevPulse Core',
    gitRemoteUrl: 'https://github.com/devpulse/core.git',
  });

  const mockSession = Object.assign(new WorkSession(), {
    id: 'ws_test123',
    startedAt: new Date('2026-03-30T10:00:00.000Z'),
    endedAt: new Date('2026-03-30T11:00:00.000Z'),
    project: mockProject,
    gitBranch: 'main',
    activeSeconds: 3600,
    focusScore: 92,
    earnedMoney: 60,
    primaryLanguage: 'typescript',
    status: WorkSessionStatus.CLOSED,
    userId: 'u_user123',
    projectId: 'p_core123',
  });

  const mockTelemetryQueue = {
    addEventsJob: jest.fn((_userId: TypeId<'users'>, _events: Array<TelemetryEventItemDto>) =>
      Promise.resolve(),
    ),
  };

  const mockTodaySummary: GetIntegrationTodayResponseDto = {
    date: '2026-03-30',
    timezone: 'Europe/Warsaw',
    currency: 'USD',
    totalActiveSeconds: 7200,
    formattedTime: '2h 0m',
    totalEarnedMoney: 120,
    averageFocusScore: 85,
    sessionsCount: 3,
  };

  const mockIntegrationsService = {
    getTodaySummary: jest.fn(() => Promise.resolve(mockTodaySummary)),
  };

  const mockSessionRepo = {
    find: jest.fn(() => Promise.resolve([mockSession])),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TelemetryController],
      providers: [
        {
          provide: TelemetryQueue,
          useValue: mockTelemetryQueue,
        },
        {
          provide: IntegrationsAnalyticsService,
          useValue: mockIntegrationsService,
        },
        {
          provide: getRepositoryToken(WorkSession),
          useValue: mockSessionRepo,
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
            req.user = mockUserEntity;
            return true;
          }
          throw new UnauthorizedException('Invalid API Key');
        },
      })
      .overrideGuard(ScopesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest<{
            headers: { authorization?: string };
            user?: AuthenticatedUser;
          }>();

          if (req.headers.authorization === 'Bearer valid-jwt') {
            req.user = mockAuthUser;
            return true;
          }
          throw new UnauthorizedException();
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 401 when API key is missing', async () => {
    const response = await request(getHttpServer(app))
      .post('/telemetry/events/batch')
      .send({ events: [] });

    expect(response.status).toBe(401);
  });

  it('should ingest telemetry batch and enqueue background job', async () => {
    const batchPayload = {
      events: [
        {
          type: 'heartbeat' as const,
          clientTimestamp: '2026-03-30T12:00:00.000Z',
          language: 'typescript',
          filePath: 'src/main.ts',
          gitBranch: 'main',
        },
      ],
    };

    const response = await request(getHttpServer(app))
      .post('/telemetry/events/batch')
      .set('x-api-key', 'valid-api-key')
      .send(batchPayload);

    const body = response.body as IngestTelemetryBatchResponseDto;

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.processedCount).toBe(1);
    expect(mockTelemetryQueue.addEventsJob).toHaveBeenCalledWith('u_user123', batchPayload.events);
  });

  it('should return today metrics for VS Code extension', async () => {
    const response = await request(getHttpServer(app))
      .get('/telemetry/today')
      .set('x-api-key', 'valid-api-key');

    const body = response.body as GetIntegrationTodayResponseDto;

    expect(response.status).toBe(200);
    expect(body.totalActiveSeconds).toBe(7200);
    expect(body.averageFocusScore).toBe(85);
    expect(body.sessionsCount).toBe(3);
  });

  it('should return work sessions for authenticated user', async () => {
    const response = await request(getHttpServer(app))
      .get('/telemetry/sessions')
      .set('Authorization', 'Bearer valid-jwt');

    const body = response.body as Array<WorkSessionSummaryDto>;

    expect(response.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1);
    expect(body[0]?.id).toBe('ws_test123');
    expect(body[0]?.projectName).toBe('DevPulse Core');
  });
});
