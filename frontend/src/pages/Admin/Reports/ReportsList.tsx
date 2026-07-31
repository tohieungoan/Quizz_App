import { Search, Download, Percent, Users as UsersIcon, Library, TrendingUp, Minus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pagination } from '@/components/ui/Pagination';
import { reportService, ReportMetrics, ReportListItem } from '@/services/reportService';

export function ReportsList() {
  const navigate = useNavigate();

  const [globalSearch, setGlobalSearch] = useState('');
  const [reportTypeFilter, setReportTypeFilter] = useState('ALL');
  const [reportPage, setReportPage] = useState(1);
  const reportsPerPage = 5;

  const [metrics, setMetrics] = useState<ReportMetrics | null>(null);
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [totalReports, setTotalReports] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportService.getMetrics().then(setMetrics).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    reportService.getReports({
      pageIndex: reportPage,
      pageSize: reportsPerPage,
      search: globalSearch,
      reportType: reportTypeFilter
    })
      .then(res => {
        setReports(res.data);
        setTotalReports(res.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [reportPage, reportsPerPage, globalSearch, reportTypeFilter]);

  const reportTotalPages = Math.max(1, Math.ceil(totalReports / reportsPerPage));
  const reportStartIndex = (reportPage - 1) * reportsPerPage;

  const handleDownload = (e: React.MouseEvent, id: number, type: string, title: string) => {
    e.stopPropagation();
    reportService.exportReport(id, type).then(blob => {
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/\s+/g, '_')}_Report.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }).catch(console.error);
  };

  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 md:p-margin-desktop lg:px-8 max-w-container-max mx-auto w-full">
      <div className="py-gutter w-full flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start w-full gap-4 sm:gap-0">
          <div>
            <h1 className="font-headline-xl text-[28px] text-on-surface font-extrabold tracking-tight">
              Analytics & Reports
            </h1>
            <p className="font-body-lg text-[15px] text-on-surface-variant mt-1">
              Platform-wide quiz reports and analytics.
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 p-6 flex flex-col gap-4 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="font-label-bold text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">Average Score</span>
              <Percent className="w-5 h-5 text-[#1a0b82]" />
            </div>
            <div>
              <div className="text-3xl font-extrabold text-[#1a0b82] mb-1">{metrics?.avg_score ?? 0}%</div>
              <p className="text-green-600 flex items-center gap-1 text-sm font-medium"><TrendingUp className="w-4 h-4" /> Live Metric</p>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-bold text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">Total Participants</span>
              <UsersIcon className="w-5 h-5 text-[#1a0b82]" />
            </div>
            <div>
              <div className="text-3xl font-extrabold text-[#1a0b82] mb-1">{metrics?.total_participants ?? 0}</div>
              <p className="text-on-surface-variant flex items-center gap-1 text-sm font-medium"><Minus className="w-4 h-4" /> Across all sessions</p>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-bold text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">Total Questions</span>
              <Library className="w-5 h-5 text-[#1a0b82]" />
            </div>
            <div>
              <div className="text-3xl font-extrabold text-[#1a0b82] mb-1">{metrics?.total_questions ?? 0}</div>
              <p className="text-on-surface-variant flex items-center gap-1 text-sm font-medium">In database</p>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4 animate-in fade-in duration-300">
            {/* Toolbar */}
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm flex flex-col">
              <div className="px-4 md:px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white rounded-xl">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search reports..."
                    value={globalSearch}
                    onChange={(e) => {
                      setGlobalSearch(e.target.value);
                      setReportPage(1);
                    }}
                    className="w-full pl-9 pr-4 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface"
                  />
                </div>
                <div className="flex items-center w-full sm:w-auto bg-surface-container-lowest p-1 rounded-xl border border-outline-variant/40">
                  <button 
                    onClick={() => { setReportTypeFilter('ALL'); setReportPage(1); }}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[13px] font-bold transition-all ${reportTypeFilter === 'ALL' ? 'bg-white text-primary shadow-sm ring-1 ring-black/5' : 'text-on-surface-variant hover:text-on-surface hover:bg-black/5'}`}
                  >
                    All Types
                  </button>
                  <button 
                    onClick={() => { setReportTypeFilter('EXAM'); setReportPage(1); }}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[13px] font-bold transition-all ${reportTypeFilter === 'EXAM' ? 'bg-white text-primary shadow-sm ring-1 ring-black/5' : 'text-on-surface-variant hover:text-on-surface hover:bg-black/5'}`}
                  >
                    Exam
                  </button>
                  <button 
                    onClick={() => { setReportTypeFilter('ROOM'); setReportPage(1); }}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[13px] font-bold transition-all ${reportTypeFilter === 'ROOM' ? 'bg-white text-primary shadow-sm ring-1 ring-black/5' : 'text-on-surface-variant hover:text-on-surface hover:bg-black/5'}`}
                  >
                    Room
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white border border-outline-variant/50 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-surface-container-lowest border-b border-outline-variant/50">
                      <th className="px-4 md:px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Exam Title</th>
                      <th className="px-4 md:px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Date & Time</th>
                      <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-center">Host</th>
                      <th className="px-4 md:px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-center">Participants</th>
                      <th className="px-4 md:px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-center">Avg Score</th>
                      <th className="px-3 md:px-4 py-4 w-10 md:w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-on-surface-variant">Loading reports...</td>
                      </tr>
                    ) : reports.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-on-surface-variant">No reports found.</td>
                      </tr>
                    ) : (
                      reports.map(r => (
                        <tr 
                          key={r.id} 
                          className="hover:bg-surface-bright transition-colors group"
                        >
                          <td className="px-4 md:px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-[15px] font-bold text-on-surface leading-tight mb-1.5 group-hover:text-primary transition-colors flex items-center flex-wrap gap-2">
                                {r.quiz_title}
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${r.type === 'EXAM' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'}`}>
                                  {r.type}
                                </span>
                              </span>
                              <span className="text-xs text-on-surface-variant leading-relaxed flex items-center flex-wrap gap-x-2 gap-y-1">
                                <span>{r.type === 'EXAM' ? 'Exam:' : 'Room:'} <strong className="font-semibold text-on-surface">{r.room_title || r.room_code}</strong></span>
                                <span className="text-outline-variant/50">•</span>
                                <span>ID: <strong className="font-semibold">{r.room_code}</strong></span>
                              </span>
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-4 text-sm text-on-surface-variant whitespace-nowrap">{r.date}</td>
                          <td className="px-6 py-4 text-sm font-medium text-on-surface text-center whitespace-nowrap">
                            {r.host}
                          </td>
                          <td className="px-4 md:px-6 py-4 text-sm font-bold text-on-surface text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <UsersIcon className="w-3.5 h-3.5 opacity-70" /> {r.participants}
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-4 text-center">
                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold w-16 bg-surface-container-high text-on-surface-variant">
                              {r.avg_score}
                            </span>
                          </td>
                          <td className="px-3 md:px-4 py-4 text-right">
                            <button onClick={(e) => handleDownload(e, r.id, r.type, r.quiz_title)} className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors" title="Download ZIP">
                              <Download className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={reportPage}
                totalPages={reportTotalPages}
                totalItems={totalReports}
                startIndex={reportStartIndex}
                itemsPerPage={reportsPerPage}
                onPageChange={(page) => setReportPage(page)}
              />
            </div>
          </section>
      </div>
    </main>
  );
}
