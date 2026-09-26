import { serverGet } from '@/shared/api/server-client';
import type { ApiKeySummary } from './api';

export const getApiKeysServer = () => serverGet<Array<ApiKeySummary>>('/api-keys');
