import { NavLink } from 'react-router-dom';
import { Languages, Search, Database, BarChart3, Layers, X } from 'lucide-react';
import Logo from './Logo';
import ServerStatus from './ServerStatus';
import { cn } from '../../lib/utils';

const navItems = [
  { to: '/', label: 'Translate', icon: Languages },
  { to: '/batch', label: 'Batch', icon: Layers },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/entries', label: 'Entries', icon: Database },
  { to: '/stats', label: 'Stats', icon: BarChart3 },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ open = false, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-30 bg-black/50 transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-60 flex-col bg-purple-900 transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
      <div className="flex items-center justify-between">
        <Logo />
        <button
          onClick={onClose}
          className="mr-2 rounded-md p-1.5 text-purple-200 hover:bg-purple-800 hover:text-white lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="mt-2 flex-1 space-y-1 overflow-y-auto px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={onClose}
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
        <ServerStatus />
      </div>
      </aside>
    </>
  );
}
