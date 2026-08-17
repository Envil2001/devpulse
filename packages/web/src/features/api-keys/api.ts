import { BaseService } from '@/shared/api/base.service';

export interface ApiKeySummary {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface CreateApiKeyResponse {
  rawKey: string;
  key: ApiKeySummary;
}

export class ApiKeysService extends BaseService {
  async list(): Promise<Array<ApiKeySummary>> {
    return this.get<Array<ApiKeySummary>>('/api-keys');
  }

  async create(name: string): Promise<CreateApiKeyResponse> {
    return this.post<CreateApiKeyResponse, { name: string }>('/api-keys', { name });
  }

  async revoke(id: string): Promise<{ message: string }> {
    return this.delete<{ message: string }>(`/api-keys/${id}`);
  }
}

export const apiKeysService = new ApiKeysService();
