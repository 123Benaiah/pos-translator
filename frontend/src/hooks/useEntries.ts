import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type {
  PaginatedEntriesResponse,
  Entry,
  EntryCreate,
  EntryUpdate,
} from '../types';

interface UseEntriesParams {
  page?: number;
  perPage?: number;
  category?: string;
  verified?: boolean;
  missing?: string;
}

export function useEntries({
  page = 1,
  perPage = 50,
  category,
  verified,
  missing,
}: UseEntriesParams = {}) {
  return useQuery<PaginatedEntriesResponse>({
    queryKey: ['entries', page, perPage, category, verified, missing],
    queryFn: async () => {
      const params: Record<string, string | number | boolean> = { page, per_page: perPage };
      if (category) params.category = category;
      if (verified !== undefined) params.verified = verified;
      if (missing) params.missing = missing;
      const { data } = await api.get<PaginatedEntriesResponse>('/entries', { params });
      return data;
    },
  });
}

export function useEntry(key: string, enabled = true) {
  return useQuery<Entry>({
    queryKey: ['entry', key],
    queryFn: async () => {
      const { data } = await api.get<Entry>(`/entries/${encodeURIComponent(key)}`);
      return data;
    },
    enabled,
  });
}

export function useCreateEntry() {
  const qc = useQueryClient();
  return useMutation<Entry, Error, EntryCreate>({
    mutationFn: async (body) => {
      const { data } = await api.post<Entry>('/entries', body);
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['entries'] });
      void qc.invalidateQueries({ queryKey: ['stats'] });
      void qc.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateEntry() {
  const qc = useQueryClient();
  return useMutation<Entry, Error, { key: string; body: EntryUpdate }>({
    mutationFn: async ({ key, body }) => {
      const { data } = await api.put<Entry>(`/entries/${encodeURIComponent(key)}`, body);
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['entries'] });
      void qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useDeleteEntry() {
  const qc = useQueryClient();
  return useMutation<{ deleted: boolean; key: string }, Error, string>({
    mutationFn: async (key) => {
      const { data } = await api.delete<{ deleted: boolean; key: string }>(
        `/entries/${encodeURIComponent(key)}`,
      );
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['entries'] });
      void qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
