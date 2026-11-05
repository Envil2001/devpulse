import { describe, expect, it, jest } from '@jest/globals';
import { type Repository } from 'typeorm';

import { type WorkSession } from '../../telemetry/entities/work-session.entity';

import { IntegrationsAnalyticsService } from './integrations-analytics.service';

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
});
