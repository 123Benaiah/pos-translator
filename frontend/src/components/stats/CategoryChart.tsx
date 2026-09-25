import Card, { CardBody, CardHeader } from '../ui/Card';
import type { StatsResponse } from '../../types';

interface CategoryChartProps {
  stats: StatsResponse;
}

export default function CategoryChart({ stats }: CategoryChartProps) {
  const entries = Object.entries(stats.by_category)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 12);

  const max = entries.length > 0 ? entries[0]![1] : 1;

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-bold text-purple-900 font-display">Entries by Category</h3>
      </CardHeader>
      <CardBody>
        <div className="space-y-3">
          {entries.map(([cat, count]) => (
            <div key={cat} className="flex items-center gap-3">
              <span className="w-24 truncate text-sm font-medium text-slate-700 capitalize">
                {cat}
              </span>
              <div className="flex-1">
                <div className="h-6 w-full overflow-hidden rounded-full bg-purple-100">
                  <div
                    className="h-full rounded-full bg-purple-600 transition-all duration-500 hover:bg-purple-800"
                    style={{ width: `${(count / max) * 100}%` }}
                  />
                </div>
              </div>
              <span className="w-10 text-right text-sm font-semibold text-purple-900">
                {count}
              </span>
            </div>
          ))}
          {entries.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">No category data available</p>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
