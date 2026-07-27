import { Library, MonitorPlay, Users, Star, LayoutDashboard } from 'lucide-react';
import { useState, useEffect } from 'react';
import { MetricCard } from './components/MetricCard';
import { HottestQuizzes } from './components/HottestQuizzes';
import { RoomDistribution } from './components/RoomDistribution';
import { ActiveRoomsTable } from './components/ActiveRoomsTable';
import { EngagementChart } from './components/EngagementChart';

export function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    const DUMMY_DASHBOARD_DATA = {
      metrics: {
        total_quizzes: 1240,
        total_users: 85200,
        active_rooms: 42,
        avg_score: 76
      },
      hottest_quizzes: [
        { quiz_id: 1, title: "Modern Neuroscience 101", play_count: 2400 },
        { quiz_id: 2, title: "Advanced Calculus Prep", play_count: 1800 },
        { quiz_id: 3, title: "World History: WWII", play_count: 1200 },
        { quiz_id: 4, title: "AP Chemistry Basics", play_count: 950 },
        { quiz_id: 5, title: "Intro to Python", play_count: 820 }
      ],
      room_distribution: {
        game_mode: 27,
        exam_mode: 15
      },
      top_active_rooms: [
        { id: 1, room_code: "EDU-4921", quiz_title: "Modern Neuroscience 101", host_name: "Prof. D. Thorne", participant_count: 24, status: "RUNNING" },
        { id: 2, room_code: "EDU-3810", quiz_title: "World History: WWII", host_name: "Dr. Sarah Jenkins", participant_count: 12, status: "RUNNING" },
        { id: 3, room_code: "EDU-9924", quiz_title: "Intro to Python", host_name: "T.A. Marcus", participant_count: 45, status: "RUNNING" },
        { id: 4, room_code: "EDU-1123", quiz_title: "Advanced Calculus", host_name: "Prof. J. Smith", participant_count: 30, status: "RUNNING" },
        { id: 5, room_code: "EDU-4452", quiz_title: "Biology 101: Cells", host_name: "Dr. M. Lee", participant_count: 18, status: "RUNNING" }
      ],
      engagement_history: [
        { date: "07-21", room_count: 12 },
        { date: "07-22", room_count: 19 },
        { date: "07-23", room_count: 15 },
        { date: "07-24", room_count: 25 },
        { date: "07-25", room_count: 22 },
        { date: "07-26", room_count: 30 },
        { date: "07-27", room_count: 42 }
      ]
    };
    
    // Simulate a brief loading time for a realistic feel
    setTimeout(() => {
      setDashboardData(DUMMY_DASHBOARD_DATA);
    }, 500);
  }, []);

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
