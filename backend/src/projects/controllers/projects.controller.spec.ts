import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import {
  type ExecutionContext,
  type INestApplication,
  NotFoundException,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';

import type { TypeId } from '@devpulse/lib';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { getHttpServer } from '../../test/get-http-server';
import type { ProjectSummaryDto } from '../dto/response/project-summary.dto';
import { ProjectsService } from '../services/projects.service';

import { ProjectsController } from './projects.controller';

describe('ProjectsController (Integration)', () => {
  let app: INestApplication;

  const mockUser: AuthenticatedUser = {
    id: 'u_test123',
    email: 'developer@devpulse.io',
    displayName: 'Test Dev',
    timezone: 'UTC',
    hourlyRate: 50,
    currency: 'USD',
  };

  const mockProject: ProjectSummaryDto = {
    id: 'p_test123',
    name: 'DevPulse Core',
    remote: 'https://github.com/devpulse/core.git',
    activeTime: '2h 30m',
    focusScore: 88,
    sessions: 5,
    lastActive: '2026-03-30T12:00:00.000Z',
    totalCommits: 10,
    totalCommands: 42,
    languages: [{ name: 'TypeScript', seconds: 9000, percentage: 100 }],
    branches: [{ name: 'main', seconds: 9000 }],
    recentSessions: [
      {
        id: 'ws_session1',
        startedAt: '2026-03-30T10:00:00.000Z',
        durationSeconds: 3600,
        gitBranch: 'main',
        primaryLanguage: 'typescript',
      },
    ],
  };

  const mockProjectsService = {
    getUserProjects: jest.fn(() => [mockProject]),
    getProjectById: jest.fn((_userId: TypeId<'users'>, projectId: TypeId<'projects'>) => {
      if (projectId === 'p_non_existent') {
        throw new NotFoundException('Project not found');
      }
      return mockProject;
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: ProjectsService,
          useValue: mockProjectsService,
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

          if (req.headers.authorization === 'Bearer valid-token') {
            req.user = mockUser;
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

  it('GET /projects - should return 401 if the request is unauthenticated', async () => {
    const response = await request(getHttpServer(app)).get('/projects');

    expect(response.status).toBe(401);
  });

  it('GET /projects - should return 200 and an array of projects for an authenticated user', async () => {
    const response = await request(getHttpServer(app))
      .get('/projects')
      .set('Authorization', 'Bearer valid-token');

    const body = response.body as Array<ProjectSummaryDto>;

    expect(response.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1);
    expect(body[0]?.id).toBe('p_test123');
    expect(body[0]?.name).toBe('DevPulse Core');
  });

  it('GET /projects/:id - should return 200 and project details for an existing ID', async () => {
    const response = await request(getHttpServer(app))
      .get('/projects/p_test123')
      .set('Authorization', 'Bearer valid-token');

    const body = response.body as ProjectSummaryDto;

    expect(response.status).toBe(200);
    expect(body.id).toBe('p_test123');
    expect(body.focusScore).toBe(88);
  });

  it('GET /projects/:id - should return 404 if a project with the specified ID is not found', async () => {
    const response = await request(getHttpServer(app))
      .get('/projects/p_non_existent')
      .set('Authorization', 'Bearer valid-token');

    const body = response.body as { message?: string };

    expect(response.status).toBe(404);
    expect(body.message).toBe('Project not found');
  });
});
