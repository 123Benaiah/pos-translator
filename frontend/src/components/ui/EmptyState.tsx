import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Languages } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <div className="mb-4 text-purple-300">
        {icon || <Languages className="h-16 w-16" />}
      </div>
      <h3 className="mb-1 text-xl font-bold text-purple-900 font-display">{title}</h3>
      {description && <p className="mb-4 max-w-sm text-sm text-slate-500">{description}</p>}
      {action}
    </div>
  );
}
