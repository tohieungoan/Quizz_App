import { Library, MonitorPlay, Users, Star, LayoutDashboard, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { dashboardService, DashboardOverviewResponse } from '@/services/dashboardService';
import { MetricCard } from './components/MetricCard';
import { HottestQuizzes } from './components/HottestQuizzes';
import { RoomDistribution } from './components/RoomDistribution';
import { ActiveRoomsTable } from './components/ActiveRoomsTable';
import { EngagementChart } from './components/EngagementChart';

export function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await dashboardService.getOverview();
        setDashboardData(data);
      } catch (err: any) {
        console.error("Failed to fetch dashboard data", err);
        setError("Failed to load dashboard metrics.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 md:p-margin-desktop lg:px-8 max-w-container-max mx-auto w-full flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center justify-center text-primary/60">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p className="font-medium text-sm">Loading metrics...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 md:p-margin-desktop lg:px-8 max-w-container-max mx-auto w-full flex items-center justify-center min-h-[50vh]">
        <div className="bg-error/10 text-error px-6 py-4 rounded-xl border border-error/20 flex flex-col items-center">
          <p className="font-bold mb-2">{error}</p>
          <button onClick={() => window.location.reload()} className="text-sm font-semibold hover:underline">Try Again</button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 md:p-margin-desktop lg:px-8 max-w-container-max mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-headline-xl text-[28px] text-on-surface font-extrabold tracking-tight">
            System Overview
          </h1>
          <p className="font-body-lg text-[15px] text-on-surface-variant mt-1">Real-time metrics and platform health.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard icon={<Library className="w-6 h-6" />} title="Total Quizzes" value={dashboardData?.metrics?.total_quizzes?.toLocaleString() || "0"} />
        <MetricCard icon={<MonitorPlay className="w-6 h-6" />} title="Active Rooms" value={dashboardData?.metrics?.active_rooms?.toLocaleString() || "0"} badge="Live" />
        <MetricCard icon={<Users className="w-6 h-6" />} title="Total Users" value={dashboardData?.metrics?.total_users?.toLocaleString() || "0"} />
        <MetricCard icon={<Star className="w-6 h-6" />} title="Avg Score" value={`${dashboardData?.metrics?.avg_score || 0}%`} />
      </div>

      <div className="mb-8">
        <EngagementChart data={dashboardData?.engagement_history || []} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <HottestQuizzes data={dashboardData?.hottest_quizzes || []} />
        <RoomDistribution data={dashboardData?.room_distribution} />
      </div>

      <ActiveRoomsTable data={dashboardData?.top_active_rooms || []} />
    </main>
  );
}
