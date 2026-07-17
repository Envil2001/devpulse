import { getJson, postJson } from './api-client';

interface RequestOptions {
  authToken?: string;
}

export abstract class BaseService {
  protected post<TResponse, TRequest>(
    path: string,
    payload: TRequest,
    options: RequestOptions = {},
  ): Promise<TResponse> {
    return postJson<TResponse, TRequest>(path, payload, options);
  }

  protected get<TResponse>(path: string, options?: RequestOptions): Promise<TResponse> {
    return getJson<TResponse>(path, options);
  }
}
