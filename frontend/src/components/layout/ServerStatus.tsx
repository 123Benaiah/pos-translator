import { RefreshCw } from 'lucide-react';
import { useHealth } from '../../hooks/useHealth';
import { API_ORIGIN } from '../../lib/api';
import { cn } from '../../lib/utils';

export default function ServerStatus() {
  const { data: health, isLoading, isFetching, isError, error, refetch } = useHealth();

  const isConnected = health?.db === 'connected' && health?.status === 'ok';
  const checking = isLoading || isFetching;

  const handleCheck = () => {
    void refetch();
  };

  const getErrorHint = () => {
    if (!isError && !health) return null;
    if (isConnected) return null;
    // Axios error message often hides CORS; give actionable hint
    const msg = error instanceof Error ? error.message : '';
    if (!health && isError) {
      return msg || 'Render server not reachable. Cold start can take ~40s on Free.';
    }
    if (health && health.db !== 'connected') {
      return 'API is up but DB is disconnected. Check MONGO_URI on Render.';
    }
    return msg || null;
  };

  const errorHint = getErrorHint();

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'h-2.5 w-2.5 rounded-full shrink-0',
            checking
              ? 'bg-yellow-400 animate-pulse'
              : isConnected
                ? 'bg-gold-400 animate-pulse'
                : 'bg-red-500',
          )}
        />
        <span className="text-xs text-purple-300 flex-1">
          {checking ? 'Checking...' : isConnected ? `Connected (${health?.entries ?? '?'} entries)` : 'Disconnected'}
        </span>
        <button
          onClick={handleCheck}
          disabled={checking}
          title={`Check Render backend at ${API_ORIGIN || '/api (same origin)'}`}
          className="rounded-md p-1.5 text-purple-300 transition-colors hover:bg-purple-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', checking && 'animate-spin')} />
        </button>
      </div>

      <div className="text-[11px] leading-tight text-purple-400/80 break-all" title={API_ORIGIN || 'Using Vite proxy /api'}>
        {API_ORIGIN || 'local /api'} {health ? `· db: ${health.db}` : ''}
      </div>

      {errorHint && (
        <div className="text-[11px] leading-tight text-red-300/90" title={errorHint}>
          {errorHint.length > 90 ? `${errorHint.slice(0, 90)}…` : errorHint}
        </div>
      )}
    </div>
  );
}
