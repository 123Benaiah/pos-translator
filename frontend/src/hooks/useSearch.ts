import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import type { SearchResponse } from '../types';

interface UseSearchParams {
  q: string;
  lang?: string;
  category?: string;
  limit?: number;
  enabled?: boolean;
}

export function useSearch({ q, lang, category, limit = 20, enabled = false }: UseSearchParams) {
  return useQuery<SearchResponse>({
    queryKey: ['search', q, lang, category, limit],
    queryFn: async () => {
      const params: Record<string, string | number> = { q, limit };
      if (lang && lang !== 'all') params.lang = lang;
      if (category) params.category = category;
      const { data } = await api.get<SearchResponse>('/search', { params });
      return data;
    },
    enabled,
  });
}
