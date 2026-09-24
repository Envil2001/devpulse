import { useMutation } from '@tanstack/react-query';
import { worklogService, DailyWorklogResponse, GenerateWorklogParams } from './api';

export function useGenerateWorklog() {
  return useMutation<DailyWorklogResponse, Error, GenerateWorklogParams>({
    mutationFn: (params) => worklogService.generateSummary(params),
  });
}
