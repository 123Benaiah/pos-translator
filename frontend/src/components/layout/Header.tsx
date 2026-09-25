import type { ReactNode } from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <header className="mb-6 flex items-center justify-between border-b-2 border-purple-600 bg-white px-6 py-4 rounded-xl shadow-sm">
      <div>
        <h2 className="text-2xl font-bold text-purple-900 font-display">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
}
