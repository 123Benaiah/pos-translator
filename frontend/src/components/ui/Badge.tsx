import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

type BadgeVariant = 'verified' | 'missing' | 'category' | 'complete' | 'default';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  verified:
    'bg-gold-100 text-gold-800 border border-gold-300',
  missing:
    'bg-orange-100 text-orange-800 border border-orange-300',
  category:
    'bg-purple-100 text-purple-700 border border-purple-200',
  complete:
    'bg-gold-50 text-gold-700 border border-gold-200',
  default:
    'bg-slate-100 text-slate-700 border border-slate-200',
};

export default function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className,
      )}
    >
      {variant === 'verified' && <Check className="h-3 w-3 text-gold-600" />}
      {children}
    </span>
  );
}
