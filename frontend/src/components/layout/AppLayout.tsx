import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {/* Mobile top bar */}
      <div className="sticky top-0 z-20 flex items-center gap-3 bg-purple-900 px-4 py-3 lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded-md p-1.5 text-white hover:bg-purple-800"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
        <span className="text-sm font-bold text-white font-display tracking-wide">
          Translator <span className="font-normal text-orange-300">EN · Lozi · Bemba</span>
        </span>
      </div>
      <main className="min-h-screen p-4 sm:p-6 lg:ml-60">
        <Outlet />
      </main>
    </div>
  );
}
