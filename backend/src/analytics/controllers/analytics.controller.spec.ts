import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import {
  type ExecutionContext,
  type INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { type AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { getHttpServer } from '../../test/get-http-server';
import { GetAnalyticsDashboardResponseDto } from '../dto/response/get-analytics-dashboard-response.dto';
import { GetIntegrationAiRoiResponseDto } from '../dto/response/get-integration-ai-roi-response.dto';
import { GetIntegrationStatusResponseDto } from '../dto/response/get-integration-status-response.dto';
import { AnalyticsService } from '../services/analytics.service';
import { AnalyticsExportService } from '../services/analytics-export.service';
import { IntegrationsAnalyticsService } from '../services/integrations-analytics.service';

import { AnalyticsController } from './analytics.controller';

describe('AnalyticsController (Integration)', () => {
  let app: INestApplication;

  const mockAuthUser: AuthenticatedUser = {
    id: 'u_user123',
    email: 'dev@devpulse.io',
    displayName: 'Dev User',
    timezone: 'Europe/Warsaw',
    hourlyRate: 60,
    currency: 'USD',
  };

  const mockDashboard = Object.assign(new GetAnalyticsDashboardResponseDto(), {
    totalActiveSeconds: 14_400,
    totalSessions: 4,
  });

  const mockLiveStatus = Object.assign(new GetIntegrationStatusResponseDto(), {
    isCoding: true,
    currentProject: 'DevPulse Core',
  });

  const mockAiRoi = Object.assign(new GetIntegrationAiRoiResponseDto(), {
    hoursSaved: 12.5,
    costSavings: 750,
  });

  const mockExportResult = {
    content: 'Session ID,Started At,Duration\nws_1,2026-03-30,3600',
    filename: 'sessions-export.csv',
    contentType: 'text/csv',
  };

  const mockAnalyticsService = {
    getDashboardStats: jest.fn(() => Promise.resolve(mockDashboard)),
  };

  const mockAnalyticsExportService = {
    exportSessions: jest.fn(() => Promise.resolve(mockExportResult)),
  };

  const mockIntegrationsService = {
    getLiveStatus: jest.fn(() => Promise.resolve(mockLiveStatus)),
    getAiRoiMetrics: jest.fn(() => Promise.resolve(mockAiRoi)),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: mockAnalyticsService,
        },
        {
          provide: AnalyticsExportService,
          useValue: mockAnalyticsExportService,
        },
        {
          provide: IntegrationsAnalyticsService,
          useValue: mockIntegrationsService,
        },
      ],
    })
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

  it('should return 401 when requesting dashboard stats without token', async () => {
    const response = await request(getHttpServer(app)).get('/analytics/dashboard');

    expect(response.status).toBe(401);
  });

  it('should return dashboard summary statistics for authenticated user', async () => {
    const response = await request(getHttpServer(app))
      .get('/analytics/dashboard')
      .set('Authorization', 'Bearer valid-jwt');

    const body = response.body as GetAnalyticsDashboardResponseDto;

    expect(response.status).toBe(200);
    expect(body).toBeDefined();
    expect(mockAnalyticsService.getDashboardStats).toHaveBeenCalled();
  });

  it('should return live coding status for authenticated user', async () => {
    const response = await request(getHttpServer(app))
      .get('/analytics/status')
      .set('Authorization', 'Bearer valid-jwt');

    const body = response.body as GetIntegrationStatusResponseDto;

    expect(response.status).toBe(200);
    expect(body).toBeDefined();
    expect(mockIntegrationsService.getLiveStatus).toHaveBeenCalled();
  });

  it('should export sessions as downloadable CSV stream', async () => {
    const response = await request(getHttpServer(app))
      .get('/analytics/export')
      .set('Authorization', 'Bearer valid-jwt');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
    expect(response.headers['content-disposition']).toBe(
      'attachment; filename="sessions-export.csv"',
    );
    expect(response.text).toContain('Session ID,Started At,Duration');
  });

  it('should return AI productivity and ROI metrics for authenticated user', async () => {
    const response = await request(getHttpServer(app))
      .get('/analytics/ai-roi')
      .set('Authorization', 'Bearer valid-jwt');

    const body = response.body as GetIntegrationAiRoiResponseDto;

    expect(response.status).toBe(200);
    expect(body).toBeDefined();
    expect(mockIntegrationsService.getAiRoiMetrics).toHaveBeenCalled();
  });
});
