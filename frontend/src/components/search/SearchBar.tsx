import { useState, useRef } from 'react';
import { Search } from 'lucide-react';
import Input from '../ui/Input';

interface SearchBarProps {
  onSearch: (query: string) => void;
  loading?: boolean;
}

export default function SearchBar({ onSearch, loading }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Input
        ref={inputRef}
        placeholder="Search translations... (min 2 characters)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-11 text-base py-3 rounded-xl border-2"
      />
      <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-purple-400" />
      <button
        type="submit"
        disabled={query.trim().length < 2 || loading}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-purple-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
      >
        Search
      </button>
    </form>
  );
}
