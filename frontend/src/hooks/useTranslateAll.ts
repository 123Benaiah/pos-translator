import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import type { TranslateAllResponse, Language } from '../types';

interface UseTranslateAllParams {
  text: string;
  fromLang: Language;
  enabled?: boolean;
}

export function useTranslateAll({ text, fromLang, enabled = false }: UseTranslateAllParams) {
  return useQuery<TranslateAllResponse>({
    queryKey: ['translateAll', text, fromLang],
    queryFn: async () => {
      const { data } = await api.get<TranslateAllResponse>('/translate-all', {
        params: { text, from_lang: fromLang },
      });
      return data;
    },
    enabled,
  });
}
