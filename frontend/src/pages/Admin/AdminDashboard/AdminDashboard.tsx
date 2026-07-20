import { Library, MonitorPlay, Users, Star } from 'lucide-react';
import { useState } from 'react';
import { MetricCard } from './components/MetricCard';
import { HottestQuizzes } from './components/HottestQuizzes';
import { RoomDistribution } from './components/RoomDistribution';
import { ActiveRoomsTable } from './components/ActiveRoomsTable';

export function AdminDashboard() {
  const [roomSearch, setRoomSearch] = useState('');

  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 md:p-margin-desktop lg:px-8 max-w-container-max mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-on-surface mb-1">System Overview</h2>
          <p className="text-body-md font-body-md text-on-surface-variant">Real-time metrics and platform health.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard icon={<Library className="w-6 h-6" />} title="Total Quizzes" value="1,240" trend="+ 12%" trendUp />
        <MetricCard icon={<MonitorPlay className="w-6 h-6" />} title="Active Rooms" value="42" badge="Live" />
        <MetricCard icon={<Users className="w-6 h-6" />} title="Total Users" value="85.2k" trend="+ 4.3%" trendUp />
        <MetricCard icon={<Star className="w-6 h-6" />} title="Avg Score" value="76%" trend="0%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <HottestQuizzes />
        <RoomDistribution />
      </div>

      <ActiveRoomsTable search={roomSearch} onSearch={setRoomSearch} />
    </main>
  );
}
