import Header from '../components/layout/Header';
import StatsCards from '../components/stats/StatsCards';
import CategoryChart from '../components/stats/CategoryChart';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { useStats } from '../hooks/useStats';
import { BarChart3 } from 'lucide-react';

export default function StatsPage() {
  const { data: stats, isLoading } = useStats();

  return (
    <div>
      <Header title="Statistics" subtitle="Overview of the translation database" />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : stats ? (
        <div className="space-y-6">
          <StatsCards stats={stats} />
          <CategoryChart stats={stats} />
        </div>
      ) : (
        <EmptyState
          icon={<BarChart3 className="h-16 w-16" />}
          title="No Stats Available"
          description="Could not load statistics. Make sure the backend is running."
        />
      )}
    </div>
  );
}
