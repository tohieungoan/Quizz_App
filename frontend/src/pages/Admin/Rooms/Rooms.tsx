import React, { useState } from 'react';
import { Search, Users, Eye, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dropdown } from '@/components/ui/Dropdown';
import { Pagination } from '@/components/ui/Pagination';
import { RoomDetailsModal } from '@/components/ui/RoomDetailsModal';
import { DUMMY_ROOMS, Room } from '@/data/mockDb';

interface RoomsProps {
  onNavigate?: (view: string, context?: any) => void;
}

export const Rooms: React.FC<RoomsProps> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>(DUMMY_ROOMS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch =
      room.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.room_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.host_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.quiz_title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || room.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenDetails = (room: Room) => {
    setSelectedRoom(room);
    setDetailsModalOpen(true);
  };

  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRooms = filteredRooms.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Reset page to 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 md:p-margin-desktop lg:px-8 max-w-container-max mx-auto w-full">
      <div className="py-gutter w-full flex flex-col gap-6 pb-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="font-headline-xl text-[28px] text-[#3a1b7e] font-extrabold tracking-tight">
              Live Rooms Management
            </h1>
            <p className="font-body-lg text-[15px] text-on-surface-variant">
              Monitor active quiz rooms, participant counts, and room statuses in real-time.
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm flex flex-col">
          <div className="px-4 md:px-6 py-4 border-b border-outline-variant/40 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white rounded-t-xl">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
              <input
                type="text"
                placeholder="Search room title, code, host..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-sm focus:outline-none focus:border-primary text-on-surface"
              />
            </div>

            <Dropdown
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'RUNNING', label: 'Running' },
                { value: 'WAITING', label: 'Waiting' },
                { value: 'FINISHED', label: 'Finished' },
              ]}
            />
          </div>

          {/* Rooms Table */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-surface-container/50 text-label-bold text-on-surface-variant uppercase text-xs tracking-wider">
                  <th className="px-6 py-4 font-semibold border-b border-outline-variant/30">Room Code</th>
                  <th className="px-6 py-4 font-semibold border-b border-outline-variant/30">Room & Quiz Title</th>
                  <th className="px-6 py-4 font-semibold border-b border-outline-variant/30">Host</th>
                  <th className="px-6 py-4 font-semibold border-b border-outline-variant/30 text-center">
                    Participants
                  </th>
                  <th className="px-6 py-4 font-semibold border-b border-outline-variant/30 text-center">Status</th>
                  <th className="px-6 py-4 font-semibold border-b border-outline-variant/30 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-body-md text-sm text-on-surface divide-y divide-outline-variant/20">
                {paginatedRooms.length > 0 ? (
                  paginatedRooms.map((room) => (
                    <tr key={room.id} className="hover:bg-surface-bright transition-colors">
                      <td className="px-6 py-4 font-bold text-primary whitespace-nowrap">{room.room_code}</td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="font-semibold text-on-surface truncate">{room.title}</div>
                        <div className="text-xs text-on-surface-variant truncate">{room.quiz_title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-on-surface-variant font-medium">
                        {room.host_name}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-on-surface">
                        <div className="inline-flex items-center gap-1 bg-surface-container px-2.5 py-1 rounded-full text-xs">
                          <Users className="w-3.5 h-3.5 text-primary" />
                          {room.participant_count}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            room.status === 'RUNNING'
                              ? 'bg-green-100 text-green-700'
                              : room.status === 'WAITING'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-surface-container text-on-surface-variant'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              room.status === 'RUNNING'
                                ? 'bg-green-600 animate-pulse'
                                : room.status === 'WAITING'
                                ? 'bg-orange-600'
                                : 'bg-outline'
                            }`}
                          ></span>
                          {room.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {room.status === 'FINISHED' && (
                            <button
                              onClick={() => {
                                if (onNavigate) {
                                  // Call the prop if it's doing something real, but in App.tsx it's dummy.
                                  onNavigate('reports', { type: room.mode || 'ROOM', roomId: room.room_code, quizTitle: room.quiz_title, roomTitle: room.title });
                                }
                                navigate(`/admin/reports/${room.room_code}`, { state: { type: room.mode || 'ROOM', roomId: room.room_code, quizTitle: room.quiz_title, roomTitle: room.title } });
                              }}
                              className="p-1.5 text-on-surface-variant hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                              title="View Report"
                            >
                              <FileText className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenDetails(room)}
                            className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-md transition-colors"
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
                    <td colSpan={6} className="px-6 py-8 text-center text-on-surface-variant">
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
        </div>

        <RoomDetailsModal
          isOpen={detailsModalOpen}
          onClose={() => {
            setDetailsModalOpen(false);
            setSelectedRoom(null);
          }}
          room={selectedRoom}
        />
      </div>
    </main>
  );
};
