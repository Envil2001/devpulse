import { useMutation } from '@tanstack/react-query';
import { worklogService } from '@/shared/api/services';
import type { DailyWorklogResponse } from '@/shared/types';
import type { GenerateWorklogParams } from './api';

export function useGenerateWorklog() {
  return useMutation<DailyWorklogResponse, Error, GenerateWorklogParams>({
    mutationFn: (params) => worklogService.generateSummary(params),
  });
}
