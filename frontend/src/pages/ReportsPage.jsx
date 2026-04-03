import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { CardSkeleton } from '../components/Skeleton';

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
      <div>
        <h1 className="font-display font-bold text-2xl mb-6">Reports</h1>
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display font-bold text-2xl mb-2">Reports</h1>
      <p className="text-slate-500 mb-6">
        Weekly, monthly, and confidence evolution reports. Export to PDF or Excel.
      </p>

      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          className="px-4 py-2 rounded-lg border border-slate-300"
        >
          <option value="weekly">Weekly Report</option>
          <option value="monthly">Monthly Report</option>
          <option value="evolution">Confidence Evolution</option>
        </select>
        {isTeacher && students.length > 0 && (
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="px-4 py-2 rounded-lg border border-slate-300"
          >
            <option value="">Select student</option>
            {students.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('excel')}
            disabled={exporting || reportType === 'evolution'}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            {exporting ? 'Exporting...' : 'Export Excel'}
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting || reportType === 'evolution'}
            className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50"
          >
            Export PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        {report?.summary && (
          <div className="mb-6">
            <h2 className="font-semibold text-lg mb-4">Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-primary-50">
                <div className="text-2xl font-bold text-primary-700">
                  {report.summary.avgConfidence ?? '-'}
                </div>
                <div className="text-sm text-primary-600">Avg Confidence</div>
              </div>
              <div className="p-4 rounded-lg bg-emerald-50">
                <div className="text-2xl font-bold text-emerald-700">
                  {report.summary.totalStudyHours ?? 0}
                </div>
                <div className="text-sm text-emerald-600">Study Hours</div>
              </div>
              <div className="p-4 rounded-lg bg-amber-50">
                <div className="text-2xl font-bold text-amber-700">
                  {report.summary.activityCount ?? 0}
                </div>
                <div className="text-sm text-amber-600">Activities</div>
              </div>
              <div className="p-4 rounded-lg bg-purple-50">
                <div className="text-2xl font-bold text-purple-700">
                  {report.summary.reflectionCount ?? 0}
                </div>
                <div className="text-sm text-purple-600">Reflections</div>
              </div>
            </div>
          </div>
        )}

        {report?.evolution && (
          <div>
            <h2 className="font-semibold mb-3">Confidence Evolution</h2>
            <div className="space-y-2">
              {report.evolution.slice(-10).map((e, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{e.week}</span>
                  <span>Avg: {e.avg?.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {report?.topicStats && report.topicStats.length > 0 && (
          <div>
            <h2 className="font-semibold mb-3">Topic Statistics</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Topic</th>
                  <th className="text-right py-2">Avg Confidence</th>
                  <th className="text-right py-2">Count</th>
                </tr>
              </thead>
              <tbody>
                {report.topicStats.map((t) => (
                  <tr key={t.topic} className="border-b">
                    <td className="py-2">{t.topic}</td>
                    <td className="text-right">{t.avgConfidence?.toFixed(1)}</td>
                    <td className="text-right">{t.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!report && !loading && (
          <p className="text-slate-500 py-8 text-center">No report data available.</p>
        )}
      </div>
    </div>
  );
}
