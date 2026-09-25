import { CheckCircle, ShieldCheck, BookOpen, AlertTriangle } from 'lucide-react';
import Card from '../ui/Card';
import type { StatsResponse } from '../../types';

interface StatsCardsProps {
  stats: StatsResponse;
}

const cards = [
  {
    key: 'total',
    label: 'Total Entries',
    getValue: (s: StatsResponse) => s.total_entries.toLocaleString(),
    gradient: 'gradient-purple',
    icon: BookOpen,
    iconColor: 'text-white/70',
    border: '',
  },
  {
    key: 'verified',
    label: 'Verified',
    getValue: (s: StatsResponse) => s.verified_entries.toLocaleString(),
    gradient: 'gradient-gold',
    icon: ShieldCheck,
    iconColor: 'text-white/70',
    border: '',
  },
  {
    key: 'complete',
    label: 'Complete (3 langs)',
    getValue: (s: StatsResponse) => s.complete_entries.toLocaleString(),
    gradient: 'gradient-orange',
    icon: CheckCircle,
    iconColor: 'text-white/70',
    border: '',
  },
  {
    key: 'missing',
    label: 'Missing Translations',
    getValue: (s: StatsResponse) => (s.missing_loz + s.missing_bem).toLocaleString(),
    gradient: '',
    icon: AlertTriangle,
    iconColor: 'text-orange-500',
    border: 'border-2 border-orange-400',
  },
];

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.key} className={`overflow-hidden ${card.border}`}>
          <div className={`${card.gradient} px-5 py-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">{card.label}</p>
                <p className="mt-1 text-3xl font-bold text-white font-display">
                  {card.getValue(stats)}
                </p>
              </div>
              <card.icon className={`h-10 w-10 ${card.iconColor}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
