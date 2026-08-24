import React, { useState } from 'react';
import { Search, Users, Eye, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Dropdown } from '@/components/ui/Dropdown';
import { Pagination } from '@/components/ui/Pagination';
import { RoomDetailsModal } from '@/components/ui/RoomDetailsModal';
import { roomService } from '@/services/roomService';
import { AdminRoomEvent, useAdminRoomsRealtime } from '@/hooks/useAdminRoomsRealtime';

export interface RoomItem {
  id: string | number;
  room_code: string;
  title: string;
  host_name?: string;
  quiz_title?: string;
  quiz_subject?: string;
  status: 'WAITING' | 'RUNNING' | 'PAUSED' | 'FINISHED' | string;
  created_at?: string;
  participant_count?: number;
}

interface RoomsProps {
  onNavigate?: (view: string, context?: any) => void;
}

export const Rooms: React.FC<RoomsProps> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [rooms, setRooms] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsRefreshKey, setDetailsRefreshKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const latestRequestId = React.useRef(0);
  const latestLoadingRequestId = React.useRef(0);

  const fetchRooms = React.useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    const requestId = ++latestRequestId.current;
    if (!silent) {
      latestLoadingRequestId.current = requestId;
      setIsLoading(true);
    }
    try {
      const data = await roomService.getAdminRooms({
        skip: (currentPage - 1) * itemsPerPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        status: statusFilter
      });
      if (requestId !== latestRequestId.current) return;
      if (data && data.data) {
        setRooms(data.data);
        setTotalItems(data.total);
        setSelectedRoom((current: RoomItem | null) => {
          if (!current) return current;
          return data.data.find((room: RoomItem) => String(room.id) === String(current.id)) || current;
        });
      } else {
        console.warn("Unexpected API response structure:", data);
        setRooms([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
    } finally {
      if (!silent && requestId === latestLoadingRequestId.current) setIsLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter]);

  const handleRealtimeInvalidation = React.useCallback((event: AdminRoomEvent | null) => {
    void fetchRooms({ silent: true });
    if (!event || (selectedRoom && String(event.room_id) === String(selectedRoom.id))) {
      setDetailsRefreshKey((value) => value + 1);
    }
  }, [fetchRooms, selectedRoom]);

  useAdminRoomsRealtime({
    enabled: true,
    fallbackIntervalMs: 15_000,
    onInvalidate: handleRealtimeInvalidation,
  });

  React.useEffect(() => {
    void fetchRooms();
  }, [fetchRooms]);

  // Use debounce for search term to avoid spamming API
  const [searchInput, setSearchInput] = useState('');
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1); // Reset to page 1 on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleOpenDetails = (room: RoomItem) => {
    setSelectedRoom(room);
    setDetailsModalOpen(true);
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;

  // Reset page to 1 when status filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  // Handle deep linking from Dashboard to open a specific room's modal
  React.useEffect(() => {
    const state = location.state as { openRoomCode?: string };
    if (state?.openRoomCode) {
      const roomToOpen = rooms.find((r) => r.room_code === state.openRoomCode);
      if (roomToOpen) {
        handleOpenDetails(roomToOpen);
        // Clear the state so it doesn't reopen if the user refreshes the page
        navigate(location.pathname, { replace: true });
      }
    }
  }, [location.state, rooms, navigate, location.pathname]);

  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 md:p-margin-desktop lg:px-8 max-w-container-max mx-auto w-full">
      <div className="py-gutter w-full flex flex-col gap-6 pb-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="font-headline-xl text-[28px] text-on-surface font-extrabold tracking-tight">
              Live Rooms Management
            </h1>
            <p className="font-body-lg text-[15px] text-on-surface-variant mt-1">
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
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
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
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                      <p className="text-on-surface-variant text-sm">Loading rooms...</p>
                    </td>
                  </tr>
                ) : rooms.length > 0 ? (
                  rooms.map((room) => (
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
                          {room.participant_count ?? room.participants?.length ?? 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            room.status === 'RUNNING' || room.status === 'PLAYING'
                              ? 'bg-green-100 text-green-700'
                              : room.status === 'WAITING'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              room.status === 'RUNNING' || room.status === 'PLAYING'
                                ? 'bg-green-600 animate-pulse'
                                : room.status === 'WAITING'
                                ? 'bg-orange-600'
                                : 'bg-slate-400'
                            }`}
                          ></span>
                          {room.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
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
            totalItems={totalItems}
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
          refreshKey={detailsRefreshKey}
        />
      </div>
    </main>
  );
};
