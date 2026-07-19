import { Shield, Library, MonitorPlay, Users, Star, TrendingUp, Minus, MoreVertical, Zap, CheckCircle2, Cpu, Search, Filter, Eye, X, ChevronLeft, ChevronRight, ChevronDown, Pause, Play } from 'lucide-react';
import { useState } from 'react';
import { Dropdown } from '../components/ui/Dropdown';
import { RoomDetailsModal } from '../components/ui/RoomDetailsModal';
import { ConfirmModal } from '../components/ui/ConfirmModal';

export function Dashboard() {

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

function MetricCard({ icon, title, value, trend, trendUp, badge }: any) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/40 shadow-sm hover:border-primary/30 transition-colors group">
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
          {icon}
        </div>
        {trend && (
          <span className={`flex items-center text-sm font-semibold px-2 py-0.5 rounded-full ${trendUp ? 'bg-secondary-container/30 text-secondary' : 'bg-surface-container text-outline'}`}>
            {trendUp ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <Minus className="w-3.5 h-3.5 mr-1" />} {trend}
          </span>
        )}
        {badge && (
          <span className="flex items-center gap-1.5 bg-error-container text-on-error-container text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-error"></span> {badge}
          </span>
        )}
      </div>
      <p className="text-body-md text-on-surface-variant text-sm mb-1">{title}</p>
      <h3 className="text-headline-lg text-on-surface">{value}</h3>
    </div>
  );
}

function HottestQuizzes() {
  const items = [
    { title: 'Modern Neuroscience 101', plays: '2.4k', w: '100%', color: 'bg-primary' },
    { title: 'Advanced Calculus Prep', plays: '1.8k', w: '75%', color: 'bg-primary/80' },
    { title: 'World History: WWII', plays: '1.2k', w: '50%', color: 'bg-primary/60' },
    { title: 'AP Chemistry Basics', plays: '950', w: '40%', color: 'bg-primary/40' },
    { title: 'Intro to Python', plays: '820', w: '35%', color: 'bg-primary/20' },
  ];
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-headline-md text-base text-on-surface">Top 5 Hottest Quizzes</h3>
        <button className="text-primary hover:bg-surface-container p-1 rounded-full"><MoreVertical className="w-5 h-5" /></button>
      </div>
      <div className="flex-1 flex flex-col gap-4 justify-center">
        {items.map((it, i) => (
          <div key={i} className="group">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-semibold text-on-surface group-hover:text-primary transition-colors truncate pr-2">{it.title}</span>
              <span className="text-on-surface-variant font-medium whitespace-nowrap">{it.plays} plays</span>
            </div>
            <div className="w-full bg-surface-container-low rounded-full h-2 overflow-hidden">
              <div className={`h-full ${it.color}`} style={{ width: it.w }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoomDistribution() {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm p-6 flex flex-col h-full items-center justify-center relative">
      <h3 className="text-headline-md text-base text-on-surface absolute top-6 left-6">Room Distribution</h3>
      <div className="relative w-48 h-48 mt-8">
        <div className="w-full h-full rounded-full" style={{ background: 'conic-gradient(var(--color-primary-container) 0% 65%, var(--color-secondary-container) 65% 100%)' }}></div>
        <div className="absolute inset-4 bg-surface-container-lowest rounded-full flex flex-col items-center justify-center">
          <span className="text-headline-lg text-primary">42</span>
          <span className="text-label-bold text-on-surface-variant uppercase text-xs tracking-wider">Active</span>
        </div>
      </div>
      <div className="flex justify-center gap-6 mt-6 w-full">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary-container"></div>
          <span className="text-body-md text-sm text-on-surface font-medium">Game Mode <span className="text-on-surface-variant ml-1">65%</span></span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-secondary-container"></div>
          <span className="text-body-md text-sm text-on-surface font-medium">Exam Mode <span className="text-on-surface-variant ml-1">35%</span></span>
        </div>
      </div>
    </div>
  );
}


function ActiveRoomsTable({ search, onSearch }: any) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isPageDropdownOpen, setIsPageDropdownOpen] = useState(false);
  const [selectedRoomCode, setSelectedRoomCode] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const itemsPerPage = 5;

  const initialRooms = [
    { code: '#EDU-4921', title: 'Modern Neuroscience 101', host: 'Prof. D. Thorne', part: 24, mode: 'EXAM', status: 'RUNNING' },
    { code: '#EDU-3810', title: 'World History: WWII', host: 'Dr. Sarah Jenkins', part: 12, mode: 'GAME', status: 'RUNNING' },
    { code: '#EDU-9924', title: 'Intro to Python', host: 'T.A. Marcus', part: 45, mode: 'GAME', status: 'RUNNING' },
    { code: '#EDU-1123', title: 'Advanced Calculus', host: 'Prof. J. Smith', part: 30, mode: 'EXAM', status: 'RUNNING' },
    { code: '#EDU-4452', title: 'Biology 101: Cells', host: 'Dr. M. Lee', part: 18, mode: 'GAME', status: 'RUNNING' },
    { code: '#EDU-7731', title: 'Physics Basics', host: 'T.A. Marcus', part: 22, mode: 'EXAM', status: 'RUNNING' },
    { code: '#EDU-8812', title: 'Literature: Shakespeare', host: 'Prof. D. Thorne', part: 15, mode: 'GAME', status: 'RUNNING' },
    { code: '#EDU-9123', title: 'Chemistry: Reactions', host: 'Dr. M. Lee', part: 28, mode: 'EXAM', status: 'RUNNING' },
    { code: '#EDU-5561', title: 'Geography: Europe', host: 'Dr. Sarah Jenkins', part: 35, mode: 'GAME', status: 'RUNNING' },
    { code: '#EDU-2234', title: 'History: Cold War', host: 'Prof. J. Smith', part: 40, mode: 'EXAM', status: 'RUNNING' },
    { code: '#EDU-4411', title: 'Computer Science 101', host: 'T.A. Marcus', part: 50, mode: 'GAME', status: 'RUNNING' },
    { code: '#EDU-1199', title: 'Art History', host: 'Prof. D. Thorne', part: 10, mode: 'EXAM', status: 'RUNNING' },
  ];

  const [allRooms, setAllRooms] = useState(initialRooms);

  // Filter based on search and filters
  const filteredRooms = allRooms.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
                          r.code.toLowerCase().includes(search.toLowerCase()) ||
                          r.host.toLowerCase().includes(search.toLowerCase());
    const matchesMode = filterMode === 'ALL' || r.mode === filterMode;
    const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
    
    return matchesSearch && matchesMode && matchesStatus;
  });

  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRooms = filteredRooms.slice(startIndex, startIndex + itemsPerPage);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm overflow-hidden mb-8 flex flex-col">
      <div className="px-4 md:px-6 py-4 md:py-5 border-b border-outline-variant/40 flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-white">
        <h3 className="text-headline-md text-base text-on-surface">Active Rooms</h3>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative group w-full sm:w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-5 h-5 group-focus-within:text-primary transition-colors" />
            <input 
              value={search} 
              onChange={e => { onSearch(e.target.value); setCurrentPage(1); }} 
              className="w-full pl-10 pr-4 py-1.5 border border-outline-variant rounded-lg bg-surface-container-lowest text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-on-surface" 
              placeholder="Search room, title..." 
            />
          </div>
          
          <Dropdown
            value={filterMode}
            onChange={(val) => { setFilterMode(val); setCurrentPage(1); }}
            options={[
              { value: 'ALL', label: 'All Modes' },
              { value: 'EXAM', label: 'Exam' },
              { value: 'GAME', label: 'Game' }
            ]}
          />
          
          <Dropdown
            value={filterStatus}
            onChange={(val) => { setFilterStatus(val); setCurrentPage(1); }}
            options={[
              { value: 'ALL', label: 'All Status' },
              { value: 'RUNNING', label: 'Running' }
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
              <th className="px-4 md:px-6 py-4 font-semibold border-b border-outline-variant/30 text-center">Participants</th>
              <th className="px-4 md:px-6 py-4 font-semibold border-b border-outline-variant/30 text-center">Mode</th>
              <th className="px-4 md:px-6 py-4 font-semibold border-b border-outline-variant/30 text-center">Status</th>
              <th className="px-4 md:px-6 py-4 font-semibold border-b border-outline-variant/30 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="text-body-md text-sm text-on-surface divide-y divide-outline-variant/20">
            {currentRooms.length > 0 ? currentRooms.map(room => (
              <tr key={room.code} className="hover:bg-surface-bright transition-colors">
                <td className="px-4 md:px-6 py-4 font-medium text-primary">{room.code}</td>
                <td className="px-4 md:px-6 py-4 font-medium">{room.title}</td>
                <td className="px-4 md:px-6 py-4 whitespace-nowrap">{room.host}</td>
                <td className="px-4 md:px-6 py-4">
                  <div className="flex -space-x-2 justify-center">
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-surface-container-high flex items-center justify-center text-xs font-bold text-on-surface-variant z-10">+{room.part}</div>
                  </div>
                </td>
                <td className="px-4 md:px-6 py-4 text-center whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${room.mode === 'EXAM' ? 'bg-secondary-container/40 text-on-secondary-container border border-secondary-container/50' : 'bg-primary-container/20 text-primary border border-primary-container/30'}`}>{room.mode}</span>
                </td>
                <td className="px-4 md:px-6 py-4 text-center">
                  {room.status === 'RUNNING' && (
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" title="Running"></span>
                  )}
                </td>
                <td className="px-4 md:px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setSelectedRoomCode(room.code)} className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-md" title="View Details">
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-on-surface-variant">No rooms found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls */}
      {totalPages > 0 && (
        <div className="px-4 md:px-6 py-4 border-t border-outline-variant/30 bg-surface-bright flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
          <span className="text-sm text-on-surface-variant text-center sm:text-left">
            Showing <span className="font-medium text-on-surface">{startIndex + 1}</span> to <span className="font-medium text-on-surface">{Math.min(startIndex + itemsPerPage, filteredRooms.length)}</span> of <span className="font-medium text-on-surface">{filteredRooms.length}</span> results
          </span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-md border border-outline-variant/50 text-on-surface-variant hover:bg-surface-container hover:text-primary disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-on-surface-variant transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setIsPageDropdownOpen(!isPageDropdownOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                  isPageDropdownOpen 
                    ? 'border-primary text-primary ring-1 ring-primary/20' 
                    : 'border-outline-variant/50 text-on-surface hover:border-outline-variant'
                }`}
              >
                Page {currentPage} of {totalPages}
                <ChevronDown className="w-4 h-4 text-on-surface-variant" />
              </button>

              {/* Dropdown Menu */}
              {isPageDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsPageDropdownOpen(false)}></div>
                  <div className="absolute bottom-full left-0 mb-2 w-full min-w-[120px] bg-white border border-outline-variant/30 shadow-lg rounded-lg overflow-hidden z-20 py-1">
                    <div className="max-h-48 overflow-y-auto">
                      {pages.map(page => (
                        <button
                          key={page}
                          onClick={() => {
                            setCurrentPage(page);
                            setIsPageDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                            currentPage === page
                              ? 'bg-primary/5 text-primary font-semibold'
                              : 'text-on-surface hover:bg-surface-container-low'
                          }`}
                        >
                          Page {page}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md border border-outline-variant/50 text-on-surface-variant hover:bg-surface-container hover:text-primary disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-on-surface-variant transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {selectedRoomCode && (
        <RoomDetailsModal 
          isOpen={!!selectedRoomCode} 
          onClose={() => setSelectedRoomCode(null)} 
          room={{
            id: selectedRoomCode,
            room_code: selectedRoomCode,
            title: allRooms.find(r => r.code === selectedRoomCode)?.title || '',
            host_name: allRooms.find(r => r.code === selectedRoomCode)?.host || '',
            quiz_title: allRooms.find(r => r.code === selectedRoomCode)?.title || '',
            status: allRooms.find(r => r.code === selectedRoomCode)?.status as any || 'RUNNING',
            created_at: '2026-07-16',
            participant_count: allRooms.find(r => r.code === selectedRoomCode)?.part || 0
          }}
        />
      )}


    </div>
  );
}
