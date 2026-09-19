import { BaseService } from '@/shared/api/base.service';

export interface ApiKeySummary {
  id: string;
  name: string;
  type: 'extension' | 'integration';
  deviceLabel: string | null;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface CreateApiKeyRequest {
  name: string;
  type: 'extension' | 'integration';
  deviceLabel?: string;
}

export interface CreateApiKeyResponse {
  rawKey: string;
  key: ApiKeySummary;
}

export class ApiKeysService extends BaseService {
  async list(): Promise<Array<ApiKeySummary>> {
    return this.get<Array<ApiKeySummary>>('/api-keys');
  }

  async create(payload: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
    return this.post<CreateApiKeyResponse, CreateApiKeyRequest>('/api-keys', payload);
  }

  async revoke(id: string): Promise<{ message: string }> {
    return this.delete<{ message: string }>(`/api-keys/${id}`);
  }
}

export const apiKeysService = new ApiKeysService();
