import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { type ApiKeySummary, apiKeysService } from '@/lib/api-keys.service';

const API_KEYS_QUERY_KEY = ['api-keys'] as const;

export function useApiKeys() {
  return useQuery({
    queryKey: API_KEYS_QUERY_KEY,
    queryFn: () => apiKeysService.list(),
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => apiKeysService.create(name),
    onSuccess: (data) => {
      queryClient.setQueryData<Array<ApiKeySummary>>(API_KEYS_QUERY_KEY, (prev) =>
        prev ? [data.key, ...prev] : [data.key],
      );
    },
  });
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiKeysService.revoke(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: API_KEYS_QUERY_KEY });
      const previous = queryClient.getQueryData<Array<ApiKeySummary>>(API_KEYS_QUERY_KEY);
      queryClient.setQueryData<Array<ApiKeySummary>>(API_KEYS_QUERY_KEY, (prev) =>
        prev?.filter((key) => key.id !== id),
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(API_KEYS_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY });
    },
  });
}
