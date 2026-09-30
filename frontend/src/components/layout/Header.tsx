import type { ReactNode } from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <header className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b-2 border-purple-600 bg-white px-4 sm:px-6 py-4 rounded-xl shadow-sm">
      <div className="min-w-0">
        <h2 className="text-xl sm:text-2xl font-bold text-purple-900 font-display truncate">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:gap-3">{actions}</div>}
    </header>
  );
}
