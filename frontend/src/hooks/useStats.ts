import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import type { StatsResponse } from '../types';

export function useStats() {
  return useQuery<StatsResponse>({
    queryKey: ['stats'],
    queryFn: async () => {
      const { data } = await api.get<StatsResponse>('/stats');
      return data;
    },
  });
}
