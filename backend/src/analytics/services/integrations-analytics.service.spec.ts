import { describe, expect, it, jest } from '@jest/globals';
import { type Repository } from 'typeorm';

import { WorkSession, WorkSessionStatus } from '../../telemetry/entities/work-session.entity';

import { IntegrationsAnalyticsService } from './integrations-analytics.service';

function repositoryWithSessions(sessions: Array<WorkSession>): Repository<WorkSession> {
  const queryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn(() => Promise.resolve(sessions)),
  };

  return {
    createQueryBuilder: jest.fn(() => queryBuilder),
  } as unknown as Repository<WorkSession>;
}

describe('IntegrationsAnalyticsService', () => {
  it('aggregates top files and immediate parent folders', async () => {
    const query = jest.fn((_sql: string, _params: Array<string>) =>
      Promise.resolve([
        { path: 'src/auth/auth.service.ts', totalSeconds: '5400' },
        { path: 'src/auth/auth.controller.ts', totalSeconds: '1800' },
        { path: 'README.md', totalSeconds: '800' },
      ]),
    );
    const repository = {
      manager: { query },
    } as unknown as Repository<WorkSession>;
    const service = new IntegrationsAnalyticsService(repository);

    const result = await service.getHotFiles('u_user123', { projectId: 'p_project123' });

    expect(result).toEqual({
      totalAttributedSeconds: 8000,
      files: [
        { path: 'src/auth/auth.service.ts', activeSeconds: 5400, percentage: 67.5 },
        { path: 'src/auth/auth.controller.ts', activeSeconds: 1800, percentage: 22.5 },
        { path: 'README.md', activeSeconds: 800, percentage: 10 },
      ],
      folders: [
        { path: 'src/auth', activeSeconds: 7200, percentage: 90 },
        { path: '.', activeSeconds: 800, percentage: 10 },
      ],
    });
    expect(query).toHaveBeenCalledWith(expect.any(String), ['u_user123', 'p_project123']);
  });

  it('explains when no tracker data exists yet', async () => {
    const repository = {
      findOne: jest.fn(() => Promise.resolve(null)),
    } as unknown as Repository<WorkSession>;
    const service = new IntegrationsAnalyticsService(repository);

    await expect(service.getLiveStatus('u_user123')).resolves.toEqual({
      isCodingNow: false,
      currentProject: null,
      currentBranch: null,
      currentLanguage: null,
      currentSessionDurationSeconds: null,
      sessionStartedAt: null,
      inactiveReason: 'no-data',
      lastSignalAt: null,
    });
  });

  it('explains when the latest tracker session is closed', async () => {
    const lastSignalAt = new Date('2026-11-06T09:30:00.000Z');
    const session = Object.assign(new WorkSession(), {
      status: WorkSessionStatus.CLOSED,
      startedAt: new Date('2026-11-06T09:00:00.000Z'),
      endedAt: lastSignalAt,
    });
    const repository = {
      findOne: jest.fn(() => Promise.resolve(session)),
    } as unknown as Repository<WorkSession>;
    const service = new IntegrationsAnalyticsService(repository);

    const result = await service.getLiveStatus('u_user123');

    expect(result.inactiveReason).toBe('session-closed');
    expect(result.lastSignalAt).toBe(lastSignalAt);
  });

  it('explains when the latest active tracker signal is stale', async () => {
    const lastSignalAt = new Date(Date.now() - 6 * 60 * 1000);
    const session = Object.assign(new WorkSession(), {
      status: WorkSessionStatus.ACTIVE,
      startedAt: new Date(lastSignalAt.getTime() - 30 * 60 * 1000),
      endedAt: lastSignalAt,
    });
    const repository = {
      findOne: jest.fn(() => Promise.resolve(session)),
    } as unknown as Repository<WorkSession>;
    const service = new IntegrationsAnalyticsService(repository);

    const result = await service.getLiveStatus('u_user123');

    expect(result.inactiveReason).toBe('signal-stale');
    expect(result.lastSignalAt).toBe(lastSignalAt);
  });

  it('returns live tracker details with no inactive reason', async () => {
    const lastSignalAt = new Date();
    const startedAt = new Date(lastSignalAt.getTime() - 30 * 60 * 1000);
    const session = Object.assign(new WorkSession(), {
      status: WorkSessionStatus.ACTIVE,
      startedAt,
      endedAt: lastSignalAt,
      project: { name: 'devpulse' },
      gitBranch: 'feat/tracker-status',
      currentLanguage: 'typescript',
      primaryLanguage: 'typescript',
      activeSeconds: 1200,
    });
    const repository = {
      findOne: jest.fn(() => Promise.resolve(session)),
    } as unknown as Repository<WorkSession>;
    const service = new IntegrationsAnalyticsService(repository);

    await expect(service.getLiveStatus('u_user123')).resolves.toEqual({
      isCodingNow: true,
      currentProject: 'devpulse',
      currentBranch: 'feat/tracker-status',
      currentLanguage: 'typescript',
      currentSessionDurationSeconds: 1200,
      sessionStartedAt: startedAt,
      inactiveReason: null,
      lastSignalAt,
    });
  });

  it('reports sample progress without claiming a speedup too early', async () => {
    const sessions = [
      Object.assign(new WorkSession(), {
        activeSeconds: 1800,
        aiAssisted: true,
        aiInteractionsCount: 3,
        commits: [{ insertions: 80, deletions: 20 }],
      }),
      Object.assign(new WorkSession(), {
        activeSeconds: 3600,
        aiAssisted: false,
        aiInteractionsCount: 0,
        commits: [{ insertions: 100, deletions: 20 }],
      }),
    ];
    const service = new IntegrationsAnalyticsService(repositoryWithSessions(sessions));

    await expect(service.getAiRoiMetrics('u_user123')).resolves.toEqual({
      aiSessionsCount: 1,
      manualSessionsCount: 1,
      totalAiInteractions: 3,
      aiActiveSeconds: 1800,
      manualActiveSeconds: 3600,
      minimumComparisonSeconds: 3600,
      comparisonReady: false,
      aiVelocityLinesPerHour: 200,
      manualVelocityLinesPerHour: 120,
      speedupPercentage: 0,
      estimatedHoursSaved: 0,
    });
  });

  it('returns a signed throughput change when both samples are comparable', async () => {
    const sessions = [
      Object.assign(new WorkSession(), {
        activeSeconds: 3600,
        aiAssisted: true,
        aiInteractionsCount: 2,
        commits: [{ insertions: 40, deletions: 10 }],
      }),
      Object.assign(new WorkSession(), {
        activeSeconds: 3600,
        aiAssisted: false,
        aiInteractionsCount: 0,
        commits: [{ insertions: 80, deletions: 20 }],
      }),
    ];
    const service = new IntegrationsAnalyticsService(repositoryWithSessions(sessions));

    const result = await service.getAiRoiMetrics('u_user123');

    expect(result.comparisonReady).toBe(true);
    expect(result.speedupPercentage).toBe(-50);
    expect(result.estimatedHoursSaved).toBe(0);
  });
});
