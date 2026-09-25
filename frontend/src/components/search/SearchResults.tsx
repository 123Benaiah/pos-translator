import type { SearchResult } from '../../types';
import Badge from '../ui/Badge';
import { cn } from '../../lib/utils';

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
}

function highlightMatch(text: string, query: string) {
  if (!query) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-gold-200 rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

export default function SearchResults({ results, query }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        No results found for "<span className="font-semibold text-purple-700">{query}</span>"
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {results.map((r, i) => (
        <div
          key={`${r.en}-${i}`}
          className={cn(
            'rounded-xl border border-purple-100 bg-white p-4 shadow-sm',
            'transition-all duration-200 hover:shadow-md hover:border-purple-200',
            'border-l-4',
            r.loz && r.bem ? 'border-l-gold-400' : 'border-l-orange-400',
          )}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <span className="text-base font-semibold text-purple-900">
                  {highlightMatch(r.en, query)}
                </span>
                {r.category && <Badge variant="category">{r.category}</Badge>}
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                {r.loz && (
                  <span>
                    <span className="text-slate-500">Lozi: </span>
                    <span className="font-medium text-orange-700">
                      {highlightMatch(r.loz, query)}
                    </span>
                  </span>
                )}
                {r.bem && (
                  <span>
                    <span className="text-slate-500">Bemba: </span>
                    <span className="font-medium text-gold-700">
                      {highlightMatch(r.bem, query)}
                    </span>
                  </span>
                )}
              </div>
            </div>
            {r.loz && r.bem && <Badge variant="complete">Complete</Badge>}
          </div>
        </div>
      ))}
    </div>
  );
}
