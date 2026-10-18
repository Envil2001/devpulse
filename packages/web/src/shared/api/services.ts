import { AuthService } from '@/features/auth/api';
import { AnalyticsService } from '@/features/analytics/api';
import { ProjectsService } from '@/features/projects/api';
import { SessionsService } from '@/features/sessions/api';
import { UsersService } from '@/features/users/api';
import { ApiKeysService } from '@/features/api-keys/api';
import { WorklogService } from '@/features/worklog/api';

export const authService = new AuthService();
export const analyticsService = new AnalyticsService();
export const projectsService = new ProjectsService();
export const sessionsService = new SessionsService();
export const usersService = new UsersService();
export const apiKeysService = new ApiKeysService();
export const worklogService = new WorklogService();
