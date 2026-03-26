import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { CardSkeleton } from '../components/Skeleton';
import { FileText, Download, FileSpreadsheet, Users, Activity, Clock, FileCheck, Brain } from 'lucide-react';

export default function ReportsPage() {
  const { user } = useAuth();
  const [reportType, setReportType] = useState('weekly');
  const [targetId, setTargetId] = useState(user?.id);
  const [students, setStudents] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  useEffect(() => {
    if (isTeacher) {
      api.get('/api/teacher/students').then(({ data }) => {
        setStudents(data);
        if (data.length) setTargetId((prev) => (prev === user?.id ? data[0]._id : prev));
      });
    }
  }, [isTeacher, user?.id]);

  useEffect(() => {
    const id = targetId || user?.id;
    if (!id) return;
    setLoading(true);
    const endpoint =
      reportType === 'weekly'
        ? `/api/report/weekly/${id}`
        : reportType === 'monthly'
        ? `/api/report/monthly/${id}`
        : `/api/report/confidence-evolution/${id}`;
    api
      .get(endpoint)
      .then(({ data }) => setReport(data))
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, [reportType, targetId, user?.id]);

  const handleExport = async (format) => {
    const id = targetId || user?.id;
    if (!id) return;
    setExporting(true);
    try {
      const res = await api.get(`/api/report/export/${format}/${id}?period=${reportType}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `report.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed');
    } finally {
      setExporting(false);
    }
  };

  if (loading && !report) {
    return (
      <div className="w-full max-w-7xl mx-auto">
        <h1 className="font-display font-bold text-3xl mb-8 text-slate-800 dark:text-white">Detailed Reports</h1>
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="font-display font-bold text-3xl mb-2 text-slate-900 dark:text-white flex items-center gap-3">
          <FileText className="text-primary-500" size={32} />
          Detailed Reports
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Weekly, monthly, and confidence evolution reports. Generate and export to PDF or Excel.
        </p>
      </div>

      <div className="glass-card rounded-2xl p-6 lg:p-8">
        <div className="flex flex-col md:flex-row flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full appearance-none pl-4 pr-10 py-3 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all font-medium"
              >
                <option value="weekly">Weekly Report</option>
                <option value="monthly">Monthly Report</option>
                <option value="evolution">Confidence Evolution</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
            
            {isTeacher && students.length > 0 && (
              <div className="relative flex-1 md:flex-none">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Users size={16} />
                </div>
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full appearance-none pl-9 pr-10 py-3 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all font-medium"
                >
                  <option value="">Select student</option>
                  {students.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={() => handleExport('excel')}
              disabled={exporting || reportType === 'evolution'}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 font-semibold hover:bg-emerald-600 hover:text-white active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 disabled:hover:bg-emerald-600/10 disabled:hover:text-emerald-700 dark:disabled:hover:text-emerald-400"
            >
              <FileSpreadsheet size={18} />
              {exporting ? 'Exporting...' : 'Excel'}
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={exporting || reportType === 'evolution'}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-rose-600/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 font-semibold hover:bg-rose-600 hover:text-white active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 disabled:hover:bg-rose-600/10 disabled:hover:text-rose-700 dark:disabled:hover:text-rose-400"
            >
              <Download size={18} />
              PDF
            </button>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 lg:p-8">
        {report?.summary && (
          <div className="mb-10">
            <h2 className="font-semibold text-xl mb-6 text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b border-slate-200/50 dark:border-dark-border pb-4">
              <Activity className="text-primary-500" size={24} />
              Report Summary
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-primary-50 to-indigo-50 dark:from-primary-900/20 dark:to-indigo-900/20 border border-primary-100/50 dark:border-primary-800/30 relative overflow-hidden group">
                <Brain className="absolute -right-3 -bottom-3 text-primary-500/10 dark:text-primary-400/10 group-hover:scale-110 transition-transform" size={80} />
                <div className="text-3xl md:text-4xl font-bold text-primary-700 dark:text-primary-400 mb-2 relative z-10">
                  {report.summary.avgConfidence ?? '-'}
                </div>
                <div className="text-xs md:text-sm font-semibold text-primary-600/80 dark:text-primary-400/80 uppercase tracking-wider relative z-10">Avg Confidence</div>
              </div>
              
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-100/50 dark:border-emerald-800/30 relative overflow-hidden group">
                <Clock className="absolute -right-3 -bottom-3 text-emerald-500/10 dark:text-emerald-400/10 group-hover:scale-110 transition-transform" size={80} />
                <div className="text-3xl md:text-4xl font-bold text-emerald-700 dark:text-emerald-400 mb-2 relative z-10">
                  {report.summary.totalStudyHours ?? 0}
                </div>
                <div className="text-xs md:text-sm font-semibold text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-wider relative z-10">Study Hours</div>
              </div>
              
              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-100/50 dark:border-amber-800/30 relative overflow-hidden group">
                <Activity className="absolute -right-3 -bottom-3 text-amber-500/10 dark:text-amber-400/10 group-hover:scale-110 transition-transform" size={80} />
                <div className="text-3xl md:text-4xl font-bold text-amber-700 dark:text-amber-400 mb-2 relative z-10">
                  {report.summary.activityCount ?? 0}
                </div>
                <div className="text-xs md:text-sm font-semibold text-amber-600/80 dark:text-amber-400/80 uppercase tracking-wider relative z-10">Activities Logged</div>
              </div>
              
              <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 border border-purple-100/50 dark:border-purple-800/30 relative overflow-hidden group">
                <FileCheck className="absolute -right-3 -bottom-3 text-purple-500/10 dark:text-purple-400/10 group-hover:scale-110 transition-transform" size={80} />
                <div className="text-3xl md:text-4xl font-bold text-purple-700 dark:text-purple-400 mb-2 relative z-10">
                  {report.summary.reflectionCount ?? 0}
                </div>
                <div className="text-xs md:text-sm font-semibold text-purple-600/80 dark:text-purple-400/80 uppercase tracking-wider relative z-10">Reflections</div>
              </div>
            </div>
          </div>
        )}

        {report?.evolution && (
          <div className="mb-8">
            <h2 className="font-semibold text-xl mb-4 text-slate-800 dark:text-slate-200">Confidence Evolution Timeline</h2>
            <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-700 before:to-transparent">
              {report.evolution.slice(-10).map((e, i) => (
                <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-dark-card bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 mx-auto z-10">
                    <span className="text-xs font-bold">{i + 1}</span>
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 dark:bg-dark-bg p-4 rounded-xl border border-slate-100 dark:border-dark-border shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{e.week}</span>
                      <span className="px-2 py-1 rounded-md text-xs font-semibold bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">Avg: {e.avg?.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {report?.topicStats && report.topicStats.length > 0 && (
          <div>
            <h2 className="font-semibold text-xl mb-6 text-slate-800 dark:text-slate-200 border-b border-slate-200/50 dark:border-dark-border pb-4">Topic Performance Breakdown</h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-dark-border">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-dark-bg text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-dark-border">
                  <tr>
                    <th className="px-6 py-4 rounded-tl-xl text-xs uppercase tracking-wider">Topic</th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-right">Avg Confidence</th>
                    <th className="px-6 py-4 rounded-tr-xl text-xs uppercase tracking-wider text-right">Logs Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-border bg-white dark:bg-dark-card">
                  {report.topicStats.map((t) => (
                    <tr key={t.topic} className="hover:bg-slate-50/50 dark:hover:bg-dark-bg/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{t.topic}</td>
                      <td className="px-6 py-4 text-right align-middle">
                        <div className="flex items-center justify-end gap-3">
                          <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden hidden sm:block">
                            <div 
                              className={`h-full rounded-full ${t.avgConfidence >= 4 ? 'bg-emerald-500' : t.avgConfidence <= 2 ? 'bg-rose-500' : 'bg-amber-500'}`}
                              style={{ width: `${(t.avgConfidence / 5) * 100}%` }}
                            ></div>
                          </div>
                          <span className={`font-bold ${t.avgConfidence >= 4 ? 'text-emerald-600 dark:text-emerald-400' : t.avgConfidence <= 2 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            {t.avgConfidence?.toFixed(1)} <span className="text-slate-400 text-xs font-normal">/ 5</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-600 dark:text-slate-300">{t.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!report && !loading && (
          <div className="py-16 text-center text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-dark-bg/30 rounded-2xl border border-dashed border-slate-200 dark:border-dark-border">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">No Report Data</h3>
            <p>Select a different timeframe or student, or log more activities to generate reports.</p>
          </div>
        )}
      </div>
    </div>
  );
}
