import { serverGet } from '@/shared/api/server-client';
import { ApiKeySummary } from '@/shared/types';

export const getApiKeysServer = () => serverGet<Array<ApiKeySummary>>('/api-keys');
