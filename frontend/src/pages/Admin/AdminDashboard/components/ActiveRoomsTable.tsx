import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
interface ActiveRoom {
  id: number;
  room_code: string;
  quiz_title: string;
  host_name: string;
  participant_count: number;
  status: string;
}

interface Props {
  data: ActiveRoom[];
}

export const ActiveRoomsTable: React.FC<Props> = ({ data }) => {
  const navigate = useNavigate();
  
  // Use passed data directly, it should already be top 5 running rooms from API
  const activeRooms = data.slice(0, 5);

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm overflow-hidden mb-8 flex flex-col">
      <div className="px-4 md:px-6 py-4 md:py-5 border-b border-outline-variant/40 flex justify-between items-center bg-white">
        <h3 className="text-headline-md text-base text-on-surface">Top 5 Active Rooms</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-surface-container/50 text-label-bold text-on-surface-variant uppercase text-xs tracking-wider">
              <th className="px-4 md:px-6 py-4 font-semibold border-b border-outline-variant/30">Room Code</th>
              <th className="px-4 md:px-6 py-4 font-semibold border-b border-outline-variant/30">Quiz Title</th>
              <th className="px-4 md:px-6 py-4 font-semibold border-b border-outline-variant/30">Host</th>
              <th className="px-4 md:px-6 py-4 font-semibold border-b border-outline-variant/30 text-center">
                Participants
              </th>
              <th className="px-4 md:px-6 py-4 border-b border-outline-variant/30"></th>
            </tr>
          </thead>
          <tbody className="text-body-md text-sm text-on-surface divide-y divide-outline-variant/20">
            {activeRooms.length > 0 ? (
              activeRooms.map((room) => (
                <tr key={room.id} className="hover:bg-surface-bright transition-colors group cursor-pointer" onClick={() => navigate('/admin/rooms', { state: { openRoomCode: room.room_code } })}>
                  <td className="px-4 md:px-6 py-4 font-medium text-primary">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          room.status === 'RUNNING' 
                            ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]' 
                            : 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]'
                        }`}
                        title={room.status}
                      ></span>
                      <span className="font-semibold text-on-surface">
                        <span className="text-primary/70 mr-0.5">#</span>
                        {room.room_code}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 font-medium">{room.quiz_title}</td>
                  <td className="px-4 md:px-6 py-4 text-sm text-on-surface-variant font-medium">
                    {room.host_name}
                  </td>
                  <td className="px-4 md:px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center bg-surface-container-highest text-on-surface-variant text-xs font-bold px-3 py-1 rounded-full border border-outline-variant/30">
                      {room.participant_count}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-4 text-right">
                    <ChevronRight className="w-5 h-5 text-outline-variant group-hover:text-primary transition-colors ml-auto" />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant">
                  No active rooms right now.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 md:px-6 py-3 border-t border-outline-variant/40 bg-surface-container/30 text-center">
        <button
          onClick={() => navigate('/admin/rooms')}
          className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          View all rooms &rarr;
        </button>
      </div>
    </div>
  );
};
