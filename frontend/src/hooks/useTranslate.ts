import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import type { TranslationResponse, Language } from '../types';

interface UseTranslateParams {
  text: string;
  fromLang: Language;
  toLang: Language;
  enabled?: boolean;
}

export function useTranslate({ text, fromLang, toLang, enabled = false }: UseTranslateParams) {
  return useQuery<TranslationResponse>({
    queryKey: ['translate', text, fromLang, toLang],
    queryFn: async () => {
      const { data } = await api.get<TranslationResponse>('/translate', {
        params: { text, from_lang: fromLang, to_lang: toLang },
      });
      return data;
    },
    enabled,
  });
}
