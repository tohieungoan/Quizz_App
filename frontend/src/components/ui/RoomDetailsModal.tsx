import { X, Search, Clock, Users, PlayCircle, StopCircle, PauseCircle, CheckCircle2, User, UserX, UserCheck, ShieldAlert, BookOpen, HelpCircle, Activity } from 'lucide-react';
import React, { useState } from 'react';
import { DUMMY_PARTICIPANTS, DUMMY_QUIZZES } from '../../data/mockDb';

interface Room {
  id: string;
  room_code: string;
  title: string;
  host_name: string;
  quiz_title: string;
  status: 'WAITING' | 'RUNNING' | 'PAUSED' | 'FINISHED';
  created_at: string;
  participant_count: number;
}

interface RoomDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
}

export function RoomDetailsModal({ isOpen, onClose, room }: RoomDetailsModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen || !room) return null;

  const participants = DUMMY_PARTICIPANTS.filter(p => p.room_id === room.id);
  const quizInfo = DUMMY_QUIZZES.find(q => q.title === room.quiz_title);
  
  const filteredParticipants = participants.filter(p => 
    p.nickname.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.user_id && p.user_id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const validScores = participants.map(p => p.score).filter(s => s !== undefined && typeof s === 'number');
  const averageScore = validScores.length > 0 ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1) : '0';
  const highestScore = validScores.length > 0 ? Math.max(...validScores) : 0;


  const getStatusBadge = (status: Room['status']) => {
    switch (status) {
      case 'RUNNING': return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200"><PlayCircle className="w-3.5 h-3.5" /> LIVE</span>;
      case 'PAUSED': return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200"><PauseCircle className="w-3.5 h-3.5" /> PAUSED</span>;
      case 'WAITING': return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200"><Clock className="w-3.5 h-3.5" /> WAITING</span>;
      case 'FINISHED': return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-surface-container-highest text-on-surface-variant border border-outline-variant"><CheckCircle2 className="w-3.5 h-3.5" /> ENDED</span>;
    }
  };

  const getParticipantStatusIcon = (status: string) => {
    switch(status) {
      case 'JOINED': return <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-md text-[11px] font-bold"><UserCheck className="w-3 h-3" /> JOINED</span>;
      case 'LEFT': return <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md text-[11px] font-bold"><UserX className="w-3 h-3" /> LEFT</span>;
      case 'KICKED': return <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded-md text-[11px] font-bold"><ShieldAlert className="w-3 h-3" /> KICKED</span>;
      case 'FINISHED': return <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md text-[11px] font-bold"><CheckCircle2 className="w-3 h-3" /> FINISHED</span>;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="bg-surface-bright w-full max-w-4xl rounded-2xl shadow-2xl relative flex flex-col h-[85vh] overflow-hidden border border-outline-variant/30">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-outline-variant/30 flex justify-between items-start bg-surface-container-lowest shrink-0">
          <div className="w-full">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="bg-primary/10 text-primary font-mono font-bold px-2.5 py-0.5 rounded-md tracking-wider text-sm border border-primary/20">
                    {room.room_code}
                  </div>
                </div>
                <h2 className="text-xl font-headline-lg font-bold text-on-surface">
                  {room.title}
                </h2>
                <p className="text-sm text-on-surface-variant mt-1">
                  Host: <strong className="text-on-surface">{room.host_name}</strong>
                </p>
              </div>
              <button onClick={onClose} className="p-2 text-on-surface-variant hover:bg-surface-container hover:text-error rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Quiz Info Box */}
            {quizInfo && (
              <div className="mt-4 p-3 bg-surface-bright border border-outline-variant/50 rounded-lg flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-on-surface">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span className="font-bold">{quizInfo.title}</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-outline-variant hidden sm:block"></div>
                <div className="flex items-center gap-1.5 text-on-surface-variant">
                  <span className="bg-surface-container px-2 py-0.5 rounded-md text-xs font-bold">{quizInfo.subject}</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-outline-variant hidden sm:block"></div>
                <div className="flex items-center gap-1.5 text-on-surface-variant">
                  <HelpCircle className="w-4 h-4" />
                  <span>{quizInfo.q} Questions</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-outline-variant hidden sm:block"></div>
                <div className="flex items-center gap-1.5 text-on-surface-variant">
                  <Activity className="w-4 h-4" />
                  <span>{quizInfo.diff}</span>
                </div>
              </div>
            )}

            {/* Room Statistics Box */}
            <div className="mt-4 grid grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-surface-bright border border-outline-variant/50 rounded-lg p-3 flex flex-col items-center justify-center shadow-sm">
                <span className="text-[10px] sm:text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Avg Score</span>
                <span className="text-lg sm:text-xl font-black text-primary">{averageScore}</span>
              </div>
              <div className="bg-surface-bright border border-outline-variant/50 rounded-lg p-3 flex flex-col items-center justify-center shadow-sm">
                <span className="text-[10px] sm:text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Highest Score</span>
                <span className="text-lg sm:text-xl font-black text-green-600">{highestScore}</span>
              </div>
              <div className="bg-surface-bright border border-outline-variant/50 rounded-lg p-3 flex flex-col items-center justify-center shadow-sm">
                <span className="text-[10px] sm:text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Total Joined</span>
                <span className="text-lg sm:text-xl font-black text-blue-600">{participants.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-surface-container-lowest p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
            <h3 className="font-bold text-on-surface text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Participants ({participants.length})
            </h3>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search nickname or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant rounded-lg py-2 pl-9 pr-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface"
              />
            </div>
          </div>

          <div className="border border-outline-variant rounded-xl flex flex-col flex-1 overflow-hidden bg-surface-bright shadow-sm">
            <div className="overflow-auto flex-1 relative">
              <table className="w-full text-left text-sm text-on-surface">
                <thead className="bg-surface-container-low text-on-surface-variant text-xs uppercase font-label-bold sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-4 font-bold border-b border-outline-variant/50">Participant (Accounts)</th>
                    <th className="px-6 py-4 font-bold border-b border-outline-variant/50">Joined At</th>
                    <th className="px-6 py-4 font-bold border-b border-outline-variant/50 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {filteredParticipants.length > 0 ? (
                    filteredParticipants.map((p) => (
                      <tr key={p.id} className="hover:bg-surface-container-lowest/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-on-surface">{p.nickname}</p>
                              {p.user_id && <p className="text-[11px] font-mono text-on-surface-variant">{p.user_id}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-on-surface-variant font-medium">
                          {p.joined_at}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-mono font-bold text-primary">{p.score}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-on-surface-variant">
                        <div className="flex flex-col items-center justify-center">
                          <Users className="w-10 h-10 mb-3 opacity-20" />
                          <p className="font-medium">No participants found</p>
                          <p className="text-xs mt-1">This room currently has no participants matching your search.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
