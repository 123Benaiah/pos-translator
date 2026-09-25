import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import type { BatchTranslateRequest, BatchTranslateResponse } from '../types';

export function useBatchTranslate() {
  return useMutation<BatchTranslateResponse, Error, BatchTranslateRequest>({
    mutationFn: async (body) => {
      const { data } = await api.post<BatchTranslateResponse>('/translate-batch', body);
      return data;
    },
  });
}
