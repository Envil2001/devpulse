import { BaseService } from '@/shared/api/base.service';

export interface WorkSessionSummary {
  id: string;
  startedAt: string;
  endedAt: string;
  projectName: string;
  gitBranch: string | null;
  durationMs: number;
  focusScore: number;
  earnedMoney: number;
  primaryLanguage: string | null;
  status: 'active' | 'closed';
}

export interface SessionCommand {
  command: string;
  cwd: string | null;
  exitCode: number | null;
  durationMs: number;
  kind: string;
  timestamp: string;
}

export interface WorkSessionDetail {
  id: string;
  projectName: string | null;
  gitBranch: string | null;
  startedAt: string;
  endedAt: string | null;
  activeSeconds: number;
  idleSeconds: number;
  focusScore: number;
  earnedMoney: number;
  primaryLanguage: string | null;
  languageSeconds: Record<string, number>;
  commandsRun: number;
  failedCommands: number;
  terminalCommands: Array<SessionCommand>;
  status: 'active' | 'closed';
}

export class SessionsService extends BaseService {
  async list(limit?: number, projectId?: string): Promise<Array<WorkSessionSummary>> {
    return this.get<Array<WorkSessionSummary>>('/telemetry/sessions', {
      params: {
        ...(limit ? { limit } : {}),
        ...(projectId ? { projectId } : {}),
      },
    });
  }
  async getById(id: string): Promise<WorkSessionDetail> {
    return this.get<WorkSessionDetail>(`/telemetry/sessions/${id}`);
  }
}

export const sessionsService = new SessionsService();
