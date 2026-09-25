import { useState, useMemo } from 'react';
import { Pencil, Trash2, ShieldCheck, Shield } from 'lucide-react';
import Badge from '../ui/Badge';
import { cn } from '../../lib/utils';
import type { Entry } from '../../types';

interface EntriesTableProps {
  entries: Entry[];
  onEdit: (entry: Entry) => void;
  onDelete: (key: string) => void;
  onToggleVerify: (key: string, current: boolean) => void;
}

export default function EntriesTable({ entries, onEdit, onDelete, onToggleVerify }: EntriesTableProps) {
  const [sortKey, setSortKey] = useState<'en' | 'loz' | 'bem'>('en');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sorted = useMemo(() => {
    return [...entries].sort((a, b) => {
      const aVal = a[sortKey] ?? '';
      const bVal = b[sortKey] ?? '';
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
  }, [entries, sortKey, sortDir]);

  const toggleSort = (key: 'en' | 'loz' | 'bem') => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ col }: { col: string }) => (
    <span className="ml-1 text-xs text-purple-400">
      {sortKey === col ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
    </span>
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-purple-100 bg-white shadow-md">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-purple-50 text-purple-900">
            <th
              className="cursor-pointer px-4 py-3 text-left font-semibold hover:text-purple-700"
              onClick={() => toggleSort('en')}
            >
              English <SortIcon col="en" />
            </th>
            <th
              className="cursor-pointer px-4 py-3 text-left font-semibold hover:text-purple-700"
              onClick={() => toggleSort('loz')}
            >
              Lozi <SortIcon col="loz" />
            </th>
            <th
              className="cursor-pointer px-4 py-3 text-left font-semibold hover:text-purple-700"
              onClick={() => toggleSort('bem')}
            >
              Bemba <SortIcon col="bem" />
            </th>
            <th className="px-4 py-3 text-left font-semibold">Category</th>
            <th className="px-4 py-3 text-left font-semibold">Status</th>
            <th className="px-4 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {sorted.map((entry) => {
            const isComplete = !!entry.loz && !!entry.bem;
            const isMissing = !entry.loz || !entry.bem;
            return (
              <tr
                key={entry._id}
                className={cn(
                  'transition-colors hover:bg-purple-50/50',
                  isComplete && 'bg-gold-50/30',
                  isMissing && !isComplete && 'bg-orange-50/30',
                )}
              >
                <td className="px-4 py-3 font-medium text-slate-900">{entry.en}</td>
                <td className="px-4 py-3">
                  {entry.loz ? (
                    <span className="text-orange-700">{entry.loz}</span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {entry.bem ? (
                    <span className="text-gold-700">{entry.bem}</span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {entry.category && <Badge variant="category">{entry.category}</Badge>}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onToggleVerify(entry.key, entry.verified)}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-all duration-200',
                      entry.verified
                        ? 'bg-gold-100 text-gold-800 border border-gold-300 hover:bg-gold-200'
                        : 'bg-orange-100 text-orange-800 border border-orange-300 hover:bg-orange-200',
                    )}
                    title={entry.verified ? 'Click to unverify' : 'Click to verify'}
                  >
                    {entry.verified ? (
                      <ShieldCheck className="h-3 w-3 text-gold-600" />
                    ) : (
                      <Shield className="h-3 w-3 text-orange-500" />
                    )}
                    {entry.verified ? 'Verified' : 'Unverified'}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(entry)}
                      className="rounded-lg p-1.5 text-purple-600 hover:bg-purple-50 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(entry.key)}
                      className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
