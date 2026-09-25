import Select from '../ui/Select';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import type { CategoriesResponse } from '../../types';

interface EntryFiltersProps {
  category: string;
  verified: string;
  missing: string;
  onCategoryChange: (v: string) => void;
  onVerifiedChange: (v: string) => void;
  onMissingChange: (v: string) => void;
}

export default function EntryFilters({
  category,
  verified,
  missing,
  onCategoryChange,
  onVerifiedChange,
  onMissingChange,
}: EntryFiltersProps) {
  const { data: catData } = useQuery<CategoriesResponse>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get<CategoriesResponse>('/categories');
      return data;
    },
  });

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...(catData?.categories.map((c) => ({ value: c, label: c })) ?? []),
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      <Select
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
        options={categoryOptions}
      />
      <Select
        value={verified}
        onChange={(e) => onVerifiedChange(e.target.value)}
        options={[
          { value: '', label: 'All Verified' },
          { value: 'true', label: 'Verified Only' },
          { value: 'false', label: 'Unverified Only' },
        ]}
      />
      <Select
        value={missing}
        onChange={(e) => onMissingChange(e.target.value)}
        options={[
          { value: '', label: 'All Entries' },
          { value: 'loz', label: 'Missing Lozi' },
          { value: 'bem', label: 'Missing Bemba' },
          { value: 'any', label: 'Missing Any' },
        ]}
      />
    </div>
  );
}
