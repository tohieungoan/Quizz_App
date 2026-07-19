import { MonitorPlay, Search, Users, PlayCircle, Clock, CheckCircle2, Trash2, StopCircle, PauseCircle, Plus, Eye, BarChart2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Dropdown } from '../components/ui/Dropdown';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { RoomDetailsModal } from '../components/ui/RoomDetailsModal';

export interface Room {
  id: string;
  room_code: string;
  title: string;
  host_name: string;
  quiz_title: string;
  status: 'WAITING' | 'RUNNING' | 'FINISHED';
  created_at: string;
  participant_count: number;
}

const initialRooms: Room[] = [
  { id: 'RM-101', room_code: 'A4B9C', title: 'Physics Midterm Review', host_name: 'Marcus Thorne', quiz_title: 'Advanced Particle Physics', status: 'RUNNING', created_at: '2026-07-14 09:00', participant_count: 34 },
  { id: 'RM-102', room_code: 'X9Y2Z', title: 'Biology Quiz 1', host_name: 'Sarah Jenkins', quiz_title: 'Cellular Biology 101', status: 'WAITING', created_at: '2026-07-14 10:15', participant_count: 12 },
  { id: 'RM-103', room_code: 'L3M4N', title: 'Math Practice', host_name: 'Dr. Evelyn Hayes', quiz_title: 'Calculus III Midterm', status: 'FINISHED', created_at: '2026-07-13 14:00', participant_count: 42 },
  { id: 'RM-104', room_code: 'K9P1R', title: 'History Pop Quiz', host_name: 'Alice Cooper', quiz_title: 'World History: WWII', status: 'RUNNING', created_at: '2026-07-14 11:30', participant_count: 28 },
  { id: 'RM-105', room_code: 'B7C8D', title: 'Chemistry Lab Quiz', host_name: 'Emily White', quiz_title: 'Organic Chemistry', status: 'RUNNING', created_at: '2026-07-14 13:45', participant_count: 18 },
];

export function Rooms({ onNavigate }: { onNavigate?: (view: any, context?: any) => void }) {
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');


  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const filteredRooms = rooms.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.room_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.host_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: Room['status']) => {
    switch (status) {
      case 'RUNNING':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200"><PlayCircle className="w-3.5 h-3.5" /> LIVE</span>;
      case 'WAITING':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200"><Clock className="w-3.5 h-3.5" /> WAITING</span>;
      case 'FINISHED':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-surface-container-highest text-on-surface-variant border border-outline-variant"><CheckCircle2 className="w-3.5 h-3.5" /> ENDED</span>;
    }
  };

  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 md:p-margin-desktop lg:px-8 max-w-container-max mx-auto w-full flex flex-col">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-[32px] font-bold text-on-surface font-headline-lg">Live Rooms</h1>
          <p className="text-[16px] text-on-surface-variant mt-1 font-body-md">Monitor and manage all active quiz sessions across the platform.</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-surface-bright border border-outline-variant rounded-xl p-4 mb-6 shadow-sm flex flex-col sm:flex-row gap-4 items-center shrink-0">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search by Title, Host, or Room Code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface transition-colors"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Dropdown
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { value: 'All', label: 'All Statuses' },
              { value: 'Running', label: 'Live / Running' },
              { value: 'Waiting', label: 'Waiting' },
              { value: 'Finished', label: 'Finished' }
            ]}
            className="w-full sm:w-[160px]"
          />
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredRooms.map(room => (
          <div key={room.id} className="bg-surface-bright border border-outline-variant rounded-2xl overflow-hidden hover:shadow-md transition-shadow group flex flex-col relative">
            <div className="p-5 border-b border-outline-variant/50 relative">
              <div className="flex justify-between items-start mb-3">
                <div className="bg-primary/10 text-primary font-mono font-bold px-3 py-1 rounded-md tracking-wider text-sm border border-primary/20">
                  {room.room_code}
                </div>
                {getStatusBadge(room.status)}
              </div>
              <h3 className="font-bold text-lg text-on-surface line-clamp-1 mb-1" title={room.title}>{room.title}</h3>
              <p className="text-sm text-on-surface-variant line-clamp-1" title={room.quiz_title}>Quiz: {room.quiz_title}</p>
            </div>
            
            <div className="px-5 py-4 bg-surface-container-lowest flex-1 flex flex-col justify-between">
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs">
                      {room.host_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div>
                      <p className="text-on-surface-variant text-xs">Hosted by</p>
                      <p className="font-medium text-on-surface">{room.host_name}</p>
                    </div>
                  </div>
                  </div>
                
                <div className="flex items-center justify-between text-sm pt-2 border-t border-outline-variant/30">
                  <span className="text-on-surface-variant">Participants</span>
                  <span className="font-bold flex items-center gap-1.5"><Users className="w-4 h-4 text-primary" /> {room.participant_count}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">Created</span>
                  <span className="font-medium">{room.created_at}</span>
                </div>
              </div>
              
              <div className="flex gap-2 mt-auto pt-4 border-t border-outline-variant/30">
                <button 
                  onClick={() => { setSelectedRoom(room); setDetailsOpen(true); }}
                  className="flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
                >
                  <Eye className="w-4 h-4" /> View Details
                </button>

                {room.status === 'FINISHED' && (
                  <button 
                    onClick={() => onNavigate && onNavigate('reports', { type: 'ROOM', roomId: room.room_code, roomTitle: room.title, quizTitle: room.quiz_title })}
                    className="flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors bg-primary/10 text-primary hover:bg-primary hover:text-on-primary"
                  >
                    <BarChart2 className="w-4 h-4" /> View Report
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredRooms.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-on-surface-variant bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant">
            <MonitorPlay className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No rooms found</p>
            <p className="text-sm">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>





      <RoomDetailsModal 
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        room={selectedRoom}
      />
    </main>
  );
}
