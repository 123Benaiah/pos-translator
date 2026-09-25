import { useState } from 'react';
import Header from '../components/layout/Header';
import SearchBar from '../components/search/SearchBar';
import SearchResults from '../components/search/SearchResults';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { useSearch } from '../hooks/useSearch';
import { Search } from 'lucide-react';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { data, isLoading } = useSearch({
    q: query,
    enabled: submitted && query.length >= 2,
  });

  const handleSearch = (q: string) => {
    setQuery(q);
    setSubmitted(true);
  };

  return (
    <div>
      <Header title="Search" subtitle="Search across all translations" />

      <div className="space-y-6">
        <SearchBar onSearch={handleSearch} loading={isLoading} />

        {isLoading && (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {!isLoading && submitted && data && (
          <div>
            <p className="mb-4 text-sm text-slate-500">
              Found <span className="font-semibold text-purple-700">{data.count}</span> results for
              "<span className="font-semibold text-purple-700">{data.query}</span>"
            </p>
            <SearchResults results={data.results} query={data.query} />
          </div>
        )}

        {!submitted && (
          <EmptyState
            icon={<Search className="h-16 w-16" />}
            title="Search the Dictionary"
            description="Type at least 2 characters to search across English, Lozi, and Bemba translations"
          />
        )}
      </div>
    </div>
  );
}
