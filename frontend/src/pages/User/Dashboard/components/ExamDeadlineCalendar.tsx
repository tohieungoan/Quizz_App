import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Users, Play, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Exam {
  id: string | number;
  title: string;
  subject: string;
  due: string;
  duration?: number;
  status: string;
  groupName?: string;
  score?: number;
}

interface ExamDeadlineCalendarProps {
  exams: Exam[];
  onStartExam: (exam: Exam) => void;
}

export const ExamDeadlineCalendar: React.FC<ExamDeadlineCalendarProps> = ({ exams, onStartExam }) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Calculate year & month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation handlers
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(today.toISOString().split('T')[0]);
  };

  // Map exams by date string 'YYYY-MM-DD'
  const examsByDate = useMemo(() => {
    const map: Record<string, Exam[]> = {};
    exams.forEach((ex) => {
      if (ex.due && ex.due !== 'No Deadline') {
        try {
          const d = new Date(ex.due);
          if (!isNaN(d.getTime())) {
            const dateStr = d.toISOString().split('T')[0];
            if (!map[dateStr]) {
              map[dateStr] = [];
            }
            map[dateStr].push(ex);
          }
        } catch (e) {
          // ignore invalid date
        }
      }
    });
    return map;
  }, [exams]);

  // Days calculation for calendar grid
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun
    const totalDays = lastDayOfMonth.getDate();

    const days: { date: Date | null; dateStr: string | null; isCurrentMonth: boolean }[] = [];

    // Empty cells before 1st of month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ date: null, dateStr: null, isCurrentMonth: false });
    }

    // Days of current month
    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, month, day);
      // Local date string YYYY-MM-DD
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({ date: d, dateStr, isCurrentMonth: true });
    }

    return days;
  }, [year, month]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const todayMidnight = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  // Exams for currently selected date
  const selectedExams = selectedDateStr ? examsByDate[selectedDateStr] || [] : [];

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-outline-variant/30 shadow-sm p-4 sm:p-6 space-y-5 text-left">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-outline-variant/20 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-on-surface flex items-center gap-2">
              Deadline Calendar
            </h3>
            <p className="text-xs text-on-surface-variant">Color-coded exam deadline tracking</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-between sm:self-auto w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={goToToday}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface transition-all"
          >
            Today
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface transition-all"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs sm:text-sm font-extrabold text-on-surface px-2 min-w-[110px] text-center">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface transition-all"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Color Legend Bar */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs font-bold pb-2 border-b border-outline-variant/15">
        <span className="text-on-surface-variant mr-1">Legend:</span>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Far (&gt;2 days)
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Near (1-2 days)
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-300" /> Overdue
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Completed
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-2">
        {/* Day Labels */}
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] sm:text-xs text-on-surface-variant uppercase tracking-wider">
          {dayLabels.map((lbl, idx) => (
            <div key={idx} className={`py-1 ${idx === 0 || idx === 6 ? 'text-indigo-400' : ''}`}>
              {lbl}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendarDays.map((item, idx) => {
            if (!item.date || !item.dateStr) {
              return <div key={idx} className="h-11 sm:h-14 rounded-xl bg-surface-container-lowest/30" />;
            }

            const dayExams = examsByDate[item.dateStr] || [];
            const hasPending = dayExams.some((e) => e.status !== 'Submitted');
            const hasSubmittedOnly = dayExams.length > 0 && dayExams.every((e) => e.status === 'Submitted');

            const isToday = item.dateStr === todayStr;
            const isSelected = item.dateStr === selectedDateStr;

            // Calculate date difference for full-block color coding
            const cellDateMidnight = new Date(item.date);
            cellDateMidnight.setHours(0, 0, 0, 0);
            const diffTime = cellDateMidnight.getTime() - todayMidnight.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            let statusType: 'none' | 'completed' | 'near_deadline' | 'far_deadline' | 'overdue' = 'none';

            if (dayExams.length > 0) {
              if (hasSubmittedOnly) {
                statusType = 'completed';
              } else if (hasPending) {
                if (diffDays < 0) {
                  statusType = 'overdue';
                } else if (diffDays <= 2) {
                  statusType = 'near_deadline';
                } else {
                  statusType = 'far_deadline';
                }
              }
            }

            // Full-block color classes according to statusType
            let blockStyle = 'bg-surface-container-lowest border-outline-variant/20 hover:bg-surface-container-low text-on-surface';

            if (statusType === 'completed') {
              blockStyle = 'bg-emerald-500 text-white border-emerald-600 shadow-xs font-black';
            } else if (statusType === 'near_deadline') {
              blockStyle = 'bg-amber-500 text-white border-amber-600 shadow-xs font-black ring-2 ring-amber-300';
            } else if (statusType === 'overdue') {
              blockStyle = 'bg-rose-100 text-rose-900 border-rose-300 shadow-xs font-black';
            } else if (statusType === 'far_deadline') {
              blockStyle = 'bg-sky-500 text-white border-sky-600 shadow-xs font-black';
            } else if (isToday) {
              blockStyle = 'bg-primary/10 border-primary text-primary font-black';
            }

            return (
              <button
                key={idx}
                onClick={() => setSelectedDateStr(item.dateStr)}
                className={`h-11 sm:h-14 p-1 rounded-xl sm:rounded-2xl transition-all relative flex flex-col items-center justify-between text-center cursor-pointer border ${blockStyle} ${
                  isSelected ? 'ring-4 ring-primary/40 scale-105 z-10 shadow-md' : ''
                }`}
              >
                {/* Date Number */}
                <span className="text-xs sm:text-sm leading-none mt-1 font-black">
                  {item.date.getDate()}
                </span>

                {/* Deadline Indicator Dot / Icon */}
                {dayExams.length > 0 && (
                  <div className="mb-1 flex items-center justify-center gap-0.5">
                    {statusType === 'completed' ? (
                      <span className="flex items-center justify-center text-white" title="All exams submitted">
                        <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    ) : statusType === 'near_deadline' ? (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-white/20 text-white">
                        Near!
                      </span>
                    ) : statusType === 'overdue' ? (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-200 text-rose-900">
                        Late!
                      </span>
                    ) : statusType === 'far_deadline' ? (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-white/20 text-white">
                        {dayExams.length}
                      </span>
                    ) : null}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Exams Panel */}
      {selectedDateStr && (
        <div className="pt-4 border-t border-outline-variant/20 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs sm:text-sm text-on-surface flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" />
              Exams Due on{' '}
              <span className="text-primary font-extrabold">
                {new Date(selectedDateStr).toLocaleDateString('vi-VN', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </h4>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
              {selectedExams.length} {selectedExams.length === 1 ? 'Exam' : 'Exams'}
            </span>
          </div>

          {selectedExams.length === 0 ? (
            <p className="text-xs text-on-surface-variant italic py-3 text-center bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant/30">
              No exam deadlines on this date. All clear! ✨
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedExams.map((exam) => (
                <div
                  key={exam.id}
                  className="p-3.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest space-y-2 flex flex-col justify-between hover:border-primary/40 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold text-primary uppercase tracking-wider">
                        {exam.subject}
                      </span>
                      {(() => {
                        const isOverdue = exam.status !== 'Submitted' && exam.due && exam.due !== 'No Deadline' && new Date(exam.due) < new Date();
                        return (
                          <span
                            className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                              exam.status === 'Submitted'
                                ? 'bg-emerald-100 text-emerald-800'
                                : isOverdue
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : exam.status === 'In Progress'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {exam.status === 'Submitted' ? 'Submitted' : isOverdue ? 'Expired' : exam.status}
                          </span>
                        );
                      })()}
                    </div>

                    <h5 className="font-bold text-xs sm:text-sm text-on-surface truncate">{exam.title}</h5>

                    <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-1">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-secondary" /> {exam.groupName || 'Individual'}
                      </span>
                      {exam.duration && <span>{exam.duration} mins</span>}
                    </div>
                  </div>

                  {(() => {
                    const isOverdue = exam.status !== 'Submitted' && exam.due && exam.due !== 'No Deadline' && new Date(exam.due) < new Date();
                    if (exam.status === 'Submitted') return null;
                    if (isOverdue) {
                      return (
                        <button
                          disabled
                          className="w-full mt-2 py-2 bg-slate-200 text-slate-500 text-xs font-bold rounded-lg cursor-not-allowed opacity-80 flex items-center justify-center gap-1 border border-slate-300"
                        >
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> Exam Expired
                        </button>
                      );
                    }
                    return (
                      <button
                        onClick={() => onStartExam(exam)}
                        className="w-full mt-2 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-xs"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        {exam.status === 'In Progress' ? 'Continue Exam' : 'Start Exam'}
                      </button>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
