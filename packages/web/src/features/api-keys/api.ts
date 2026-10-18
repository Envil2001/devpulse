import { BaseService } from '@/shared/api/base.service';
import type { ApiKeySummary, CreateApiKeyRequest, CreateApiKeyResponse } from '@/shared/types';

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
