import { NavLink } from 'react-router-dom';
import { Languages, Search, Database, BarChart3, Layers } from 'lucide-react';
import Logo from './Logo';
import { useHealth } from '../../hooks/useHealth';
import { cn } from '../../lib/utils';

const navItems = [
  { to: '/', label: 'Translate', icon: Languages },
  { to: '/batch', label: 'Batch', icon: Layers },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/entries', label: 'Entries', icon: Database },
  { to: '/stats', label: 'Stats', icon: BarChart3 },
];

export default function Sidebar() {
  const { data: health } = useHealth();
  const isConnected = health?.db === 'connected';

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col bg-purple-900">
      <Logo />

      <nav className="mt-2 flex-1 space-y-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-purple-800 text-white border-l-4 border-orange-500'
                  : 'text-purple-200 hover:bg-purple-800/60 hover:text-white',
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-purple-800 px-4 py-4">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'h-2.5 w-2.5 rounded-full',
              isConnected ? 'bg-gold-400 animate-pulse' : 'bg-red-500',
            )}
          />
          <span className="text-xs text-purple-300">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    </aside>
  );
}
