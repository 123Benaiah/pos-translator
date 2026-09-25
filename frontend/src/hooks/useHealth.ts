import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import type { HealthResponse } from '../types';

export function useHealth() {
  return useQuery<HealthResponse>({
    queryKey: ['health'],
    queryFn: async () => {
      const { data } = await api.get<HealthResponse>('/health');
      return data;
    },
    refetchInterval: 30000,
  });
}
