import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { Card, CardHeader, CardBody, StatusBadge } from './ui.jsx';
import { FileSearch, Filter } from 'lucide-react';

export default function AdminMockTestReports({ users }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teacherFilter, setTeacherFilter] = useState('');
  const [studentFilter, setStudentFilter] = useState('');

  useEffect(() => {
    api
      .get('/api/admin/reports/mocktests')
      .then(({ data }) => setReports(data || []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, []);

  const teachers = useMemo(
    () => users.filter((u) => u.role === 'teacher'),
    [users]
  );
  const students = useMemo(
    () => users.filter((u) => u.role === 'student'),
    [users]
  );

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (teacherFilter && r.teacher?._id !== teacherFilter) return false;
      if (studentFilter && r.student?._id !== studentFilter) return false;
      return true;
    });
  }, [reports, teacherFilter, studentFilter]);

  return (
    <div className="glass-card rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-dark-border">
      <div className="p-6 border-b border-slate-200/50 dark:border-dark-border bg-slate-50/50 dark:bg-dark-card/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold text-lg text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <FileSearch className="text-primary-500" size={20} />
            Mock Test Reports
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Centralized view of mock test performance across teachers and students.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <Filter size={14} />
            </div>
            <select
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value)}
              className="pl-8 pr-8 py-2 appearance-none rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
            >
              <option value="">All teachers</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <Filter size={14} />
            </div>
            <select
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
              className="pl-8 pr-8 py-2 appearance-none rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
            >
              <option value="">All students</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-0">
        {loading ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center">
            <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin mb-3"></div>
            Loading reports...
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <FileSearch size={32} className="mx-auto mb-3 opacity-40" />
            No mock test attempts found for the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-dark-bg sticky top-0 z-10 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-dark-border font-semibold">
                <tr>
                  <th className="text-left p-4 whitespace-nowrap">Student</th>
                  <th className="text-left p-4 whitespace-nowrap">Teacher</th>
                  <th className="text-left p-4 whitespace-nowrap">Subject / Topic</th>
                  <th className="text-right p-4 whitespace-nowrap">Score</th>
                  <th className="text-right p-4 whitespace-nowrap">Confidence</th>
                  <th className="text-left p-4 whitespace-nowrap">Validation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border bg-white dark:bg-dark-card">
                {filteredReports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-dark-bg/50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{r.student?.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{r.student?.email}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{r.teacher?.name}</div>
                      {r.teacher?.email && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">{r.teacher.email}</div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{r.subject}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{r.topicName || '-'}</div>
                    </td>
                    <td className="p-4 text-right align-middle">
                      <span className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-bold ${
                        r.score >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        r.score >= 60 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                      }`}>
                        {r.score}%
                      </span>
                    </td>
                    <td className="p-4 text-right font-semibold text-slate-700 dark:text-slate-300">
                      {r.confidenceAtTest ? `${r.confidenceAtTest.toFixed(1)}/5` : '-'}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={r.validationStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

