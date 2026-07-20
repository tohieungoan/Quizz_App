import React, { useState } from 'react';
import { Search, Eye } from 'lucide-react';
import { Dropdown } from '@/components/ui/Dropdown';
import { RoomDetailsModal } from '@/components/ui/RoomDetailsModal';
import { Pagination } from '@/components/ui/Pagination';
import { DUMMY_ROOMS, Room } from '@/data/mockDb';

interface ActiveRoomsTableProps {
  search: string;
  onSearch: (value: string) => void;
}

export const ActiveRoomsTable: React.FC<ActiveRoomsTableProps> = ({ search, onSearch }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRoomCode, setSelectedRoomCode] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<string>('ALL');
  const itemsPerPage = 5;

  const [allRooms] = useState<Room[]>(DUMMY_ROOMS);

  // Filter based on search and filters
  const filteredRooms = allRooms.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.room_code.toLowerCase().includes(search.toLowerCase()) ||
      r.host_name.toLowerCase().includes(search.toLowerCase());
    const matchesMode = filterMode === 'ALL' || r.mode === filterMode;
    const isActive = r.status === 'RUNNING' || r.status === 'WAITING';

    return matchesSearch && matchesMode && isActive;
  });

  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRooms = filteredRooms.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm overflow-hidden mb-8 flex flex-col">
      <div className="px-4 md:px-6 py-4 md:py-5 border-b border-outline-variant/40 flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-white">
        <h3 className="text-headline-md text-base text-on-surface">Active Rooms</h3>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative group w-full sm:w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-5 h-5 group-focus-within:text-primary transition-colors" />
            <input
              value={search}
              onChange={(e) => {
                onSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-1.5 border border-outline-variant rounded-lg bg-surface-container-lowest text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-on-surface"
              placeholder="Search room, title..."
            />
          </div>

          <Dropdown
            value={filterMode}
            onChange={(val) => {
              setFilterMode(val);
              setCurrentPage(1);
            }}
            options={[
              { value: 'ALL', label: 'All Modes' },
              { value: 'EXAM', label: 'Exam' },
              { value: 'GAME', label: 'Game' },
            ]}
          />
        </div>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-surface-container/50 text-label-bold text-on-surface-variant uppercase text-xs tracking-wider">
              <th className="px-4 md:px-6 py-4 font-semibold border-b border-outline-variant/30">Room Code</th>
              <th className="px-4 md:px-6 py-4 font-semibold border-b border-outline-variant/30">Quiz Title</th>
              <th className="px-4 md:px-6 py-4 font-semibold border-b border-outline-variant/30">Host</th>
              <th className="px-4 md:px-6 py-4 font-semibold border-b border-outline-variant/30 text-center">
                Participants
              </th>
              <th className="px-4 md:px-6 py-4 font-semibold border-b border-outline-variant/30 text-center">Mode</th>
              <th className="px-4 md:px-6 py-4 font-semibold border-b border-outline-variant/30 text-center">
                Status
              </th>
              <th className="px-4 md:px-6 py-4 font-semibold border-b border-outline-variant/30 text-right">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="text-body-md text-sm text-on-surface divide-y divide-outline-variant/20">
            {currentRooms.length > 0 ? (
              currentRooms.map((room) => (
                <tr key={room.id} className="hover:bg-surface-bright transition-colors">
                  <td className="px-4 md:px-6 py-4 font-medium text-primary">{room.room_code}</td>
                  <td className="px-4 md:px-6 py-4 font-medium">{room.title}</td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">{room.host_name}</td>
                  <td className="px-4 md:px-6 py-4">
                    <div className="flex -space-x-2 justify-center">
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-surface-container-high flex items-center justify-center text-xs font-bold text-on-surface-variant z-10">
                        +{room.participant_count}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 text-center whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        room.mode === 'EXAM'
                          ? 'bg-secondary-container/40 text-on-secondary-container border border-secondary-container/50'
                          : 'bg-primary-container/20 text-primary border border-primary-container/30'
                      }`}
                    >
                      {room.mode || 'GAME'}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-4 text-center">
                    {room.status === 'RUNNING' ? (
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                        title="Running"
                      ></span>
                    ) : room.status === 'WAITING' ? (
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"
                        title="Waiting"
                      ></span>
                    ) : null}
                  </td>
                  <td className="px-4 md:px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedRoomCode(room.room_code)}
                        className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-md"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-on-surface-variant">
                  No rooms found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredRooms.length}
        startIndex={startIndex}
        itemsPerPage={itemsPerPage}
        onPageChange={(page) => setCurrentPage(page)}
      />

      {selectedRoomCode && (
        <RoomDetailsModal
          isOpen={!!selectedRoomCode}
          onClose={() => setSelectedRoomCode(null)}
          room={{
            id: selectedRoomCode,
            room_code: selectedRoomCode,
            title: allRooms.find((r) => r.room_code === selectedRoomCode)?.title || '',
            host_name: allRooms.find((r) => r.room_code === selectedRoomCode)?.host_name || '',
            quiz_title: allRooms.find((r) => r.room_code === selectedRoomCode)?.quiz_title || '',
            status: (allRooms.find((r) => r.room_code === selectedRoomCode)?.status as any) || 'RUNNING',
            created_at: '2026-07-16',
            participant_count: allRooms.find((r) => r.room_code === selectedRoomCode)?.participant_count || 0,
          }}
        />
      )}
    </div>
  );
};
