import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  apiKeysService,
  CreateApiKeyRequest,
  type ApiKeySummary,
  type CreateApiKeyResponse,
} from './api';

export const apiKeysKeys = {
  all: ['api-keys'] as const,
  list: () => ['api-keys'] as const,
};

interface RevokeContext {
  previous: Array<ApiKeySummary> | undefined;
}

export function useApiKeys() {
  return useQuery<Array<ApiKeySummary>>({
    queryKey: apiKeysKeys.list(),
    queryFn: () => apiKeysService.list(),
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();

  return useMutation<CreateApiKeyResponse, Error, CreateApiKeyRequest>({
    mutationFn: (payload) => apiKeysService.create(payload),
    onSuccess: (data) => {
      queryClient.setQueryData<Array<ApiKeySummary>>(apiKeysKeys.list(), (prev) =>
        prev ? [data.key, ...prev] : [data.key],
      );
    },
  });
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, string, RevokeContext>({
    mutationFn: (id: string) => apiKeysService.revoke(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: apiKeysKeys.list() });
      const previous = queryClient.getQueryData<Array<ApiKeySummary>>(apiKeysKeys.list());
      queryClient.setQueryData<Array<ApiKeySummary>>(apiKeysKeys.list(), (prev) =>
        prev?.filter((key) => key.id !== id),
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(apiKeysKeys.list(), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: apiKeysKeys.list() });
    },
  });
}
