import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import type { SuggestResponse } from '../types';

interface UseSuggestParams {
  q: string;
  lang?: string;
  limit?: number;
  enabled?: boolean;
}

export function useSuggest({ q, lang = 'en', limit = 8, enabled = false }: UseSuggestParams) {
  return useQuery<SuggestResponse>({
    queryKey: ['suggest', q, lang, limit],
    queryFn: async () => {
      const { data } = await api.get<SuggestResponse>('/suggest', {
        params: { q, lang, limit },
      });
      return data;
    },
    enabled,
  });
}
