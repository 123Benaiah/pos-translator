import type { TranslateAllResponse } from '../../types';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import { cn } from '../../lib/utils';
import { Check, X } from 'lucide-react';

interface TranslationCardProps {
  data: TranslateAllResponse;
}

const langNames: Record<string, string> = {
  en: 'English',
  loz: 'Lozi',
  bem: 'Bemba',
};

const langBorderColors: Record<string, string> = {
  en: 'border-l-purple-500',
  loz: 'border-l-orange-500',
  bem: 'border-l-gold-400',
};

export default function TranslationCard({ data }: TranslationCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-600">
            Result for "<span className="font-semibold text-purple-900">{data.input}</span>"
          </span>
          <div className="flex items-center gap-2">
            {data.category && <Badge variant="category">{data.category}</Badge>}
            {data.verified ? (
              <Badge variant="verified">Verified</Badge>
            ) : (
              <Badge variant="missing">Unverified</Badge>
            )}
          </div>
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {(Object.keys(data.translations) as string[]).map((lang) => {
          const val = data.translations[lang as keyof typeof data.translations];
          const hasValue = val.length > 0;
          return (
            <div
              key={lang}
              className={cn(
                'flex items-center justify-between border-l-4 px-5 py-3',
                hasValue ? langBorderColors[lang] ?? 'border-l-slate-300' : 'border-l-red-300',
                hasValue ? 'bg-white' : 'bg-orange-50/30',
              )}
            >
              <span className="text-sm font-medium text-slate-700">
                {langNames[lang] ?? lang}
              </span>
              <div className="flex items-center gap-2">
                {hasValue ? (
                  <>
                    <span className="text-sm font-semibold text-slate-900">{val}</span>
                    <Check className="h-4 w-4 text-emerald-500" />
                  </>
                ) : (
                  <>
                    <span className="text-sm text-slate-400">Missing</span>
                    <X className="h-4 w-4 text-red-400" />
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
