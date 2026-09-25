import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Language } from '../types';

interface LanguageState {
  fromLang: Language;
  toLang: Language;
  setFromLang: (lang: Language) => void;
  setToLang: (lang: Language) => void;
  swapLangs: () => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      fromLang: 'en',
      toLang: 'bem',
      setFromLang: (lang) => set({ fromLang: lang }),
      setToLang: (lang) => set({ toLang: lang }),
      swapLangs: () =>
        set((state) => ({
          fromLang: state.toLang,
          toLang: state.fromLang,
        })),
    }),
    { name: 'pos-translator-langs' },
  ),
);
