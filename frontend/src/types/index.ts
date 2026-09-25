export type Language = 'en' | 'loz' | 'bem';

export const LANGUAGES: { code: Language; name: string; native: string }[] = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'loz', name: 'Lozi', native: 'Silozi' },
  { code: 'bem', name: 'Bemba', native: 'Ichibemba' },
];

export interface TranslationResponse {
  input: string;
  from: string;
  to: string;
  output: string | null;
  found: boolean;
  verified: boolean;
}

export interface TranslateAllResponse {
  input: string;
  found: boolean;
  translations: Record<Language, string>;
  category: string | null;
  verified: boolean;
}

export interface BatchItemResult {
  input: string;
  output: string | null;
  found: boolean;
}

export interface BatchTranslateResponse {
  results: BatchItemResult[];
  total: number;
  found_count: number;
}

export interface BatchTranslateRequest {
  items: string[];
  from_lang: Language;
  to_lang: Language;
}

export interface SearchResult {
  en: string;
  loz: string;
  bem: string;
  category: string | null;
}

export interface SearchResponse {
  query: string;
  count: number;
  results: SearchResult[];
}

export interface SuggestResponse {
  query: string;
  suggestions: string[];
}

export interface Entry {
  _id: string;
  key: string;
  en: string;
  loz: string;
  bem: string;
  category: string | null;
  verified: boolean;
  source: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface PaginatedEntriesResponse {
  page: number;
  per_page: number;
  total: number;
  pages: number;
  entries: Entry[];
}

export interface EntryCreate {
  en: string;
  loz?: string;
  bem?: string;
  category?: string;
}

export interface EntryUpdate {
  loz?: string;
  bem?: string;
  category?: string;
  verified?: boolean;
}

export interface StatsResponse {
  total_entries: number;
  verified_entries: number;
  complete_entries: number;
  missing_loz: number;
  missing_bem: number;
  by_category: Record<string, number>;
}

export interface HealthResponse {
  status: string;
  db: string;
  entries: number;
}

export interface LanguageInfo {
  code: string;
  name: string;
  native: string;
}

export interface LanguagesResponse {
  languages: LanguageInfo[];
}

export interface CategoriesResponse {
  categories: string[];
}

export interface ApiError {
  error: string;
  detail?: string;
}
