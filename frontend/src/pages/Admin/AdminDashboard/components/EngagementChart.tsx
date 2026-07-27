import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface EngagementData {
  date: string;
  room_count: number;
}

interface Props {
  data: EngagementData[];
}

export const EngagementChart: React.FC<Props> = ({ data }) => {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm p-6 flex flex-col w-full h-full min-h-[350px]">
      <div className="mb-6">
        <h3 className="text-headline-md text-base text-on-surface font-extrabold tracking-tight">System Engagement</h3>
        <p className="text-sm text-on-surface-variant">Rooms created over the last 7 days</p>
      </div>
      <div className="w-full mt-2" style={{ height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRooms" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7eeff" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#777587', fontSize: 12}} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#777587', fontSize: 12}} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              labelStyle={{ color: '#111c2d', fontWeight: 'bold', marginBottom: '4px' }}
            />
            <Area 
              type="monotone" 
              dataKey="room_count" 
              name="Rooms Created"
              stroke="#4f46e5" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorRooms)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
