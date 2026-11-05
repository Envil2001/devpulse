import { serverGet } from '@/shared/api/server-client';
import { type ApiKeySummary } from '@/shared/types';

export const getApiKeysServer = (): Promise<Array<ApiKeySummary>> =>
  serverGet<Array<ApiKeySummary>>('/api-keys');
