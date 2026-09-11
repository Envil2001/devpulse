import { deleteJson, getBlob, getJson, patchJson, postJson, type QueryParams } from './api-client';

interface RequestOptions {
  authToken?: string;
}

interface GetOptions extends RequestOptions {
  params?: QueryParams;
}

export abstract class BaseService {
  protected post<TResponse, TRequest>(
    path: string,
    payload: TRequest,
    options: RequestOptions = {},
  ): Promise<TResponse> {
    return postJson<TResponse, TRequest>(path, payload, options);
  }

  protected get<TResponse>(path: string, options?: GetOptions): Promise<TResponse> {
    return getJson<TResponse>(path, options);
  }

  protected delete<TResponse>(path: string, options?: RequestOptions): Promise<TResponse> {
    return deleteJson<TResponse>(path, options);
  }

  protected patch<TResponse, TRequest>(
    path: string,
    payload: TRequest,
    options: RequestOptions = {},
  ): Promise<TResponse> {
    return patchJson<TResponse, TRequest>(path, payload, options);
  }

  protected getBlob(path: string, options?: GetOptions): Promise<Blob> {
    return getBlob(path, options);
  }
}
