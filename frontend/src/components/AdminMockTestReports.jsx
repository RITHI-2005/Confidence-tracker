import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { Card, CardHeader, CardBody, StatusBadge } from './ui.jsx';

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
    <Card>
      <CardHeader
        title="Mock Test Reports"
        subtitle="Centralized view of mock test performance across teachers and students."
        actions={
          <div className="flex flex-wrap gap-2">
            <select
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
            >
              <option value="">All teachers</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
            <select
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
            >
              <option value="">All students</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        }
      />
      <CardBody>
        {loading ? (
          <p className="text-sm text-slate-500 py-4">Loading mock test reports...</p>
        ) : filteredReports.length === 0 ? (
          <p className="text-sm text-slate-500 py-4">
            No mock test attempts found for the selected filters.
          </p>
        ) : (
          <div className="overflow-x-auto max-h-80 overflow-y-auto text-xs md:text-sm">
            <table className="w-full">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="text-left p-2">Student</th>
                  <th className="text-left p-2">Teacher</th>
                  <th className="text-left p-2">Subject</th>
                  <th className="text-left p-2">Skill / Topic</th>
                  <th className="text-right p-2">Score</th>
                  <th className="text-right p-2">Confidence</th>
                  <th className="text-left p-2">Validation</th>
                  <th className="text-left p-2">Rating</th>
                  <th className="text-left p-2">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredReports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="p-2">
                      {r.student?.name}{' '}
                      <span className="text-slate-400">({r.student?.email})</span>
                    </td>
                    <td className="p-2">
                      {r.teacher?.name}{' '}
                      {r.teacher?.email && (
                        <span className="text-slate-400">({r.teacher.email})</span>
                      )}
                    </td>
                    <td className="p-2">{r.subject}</td>
                    <td className="p-2">{r.topicName || '-'}</td>
                    <td className="p-2 text-right">{r.score}%</td>
                    <td className="p-2 text-right">
                      {r.confidenceAtTest ? r.confidenceAtTest.toFixed(1) : '-'}
                    </td>
                    <td className="p-2">
                      <StatusBadge status={r.validationStatus} />
                    </td>
                    <td className="p-2 text-left">
                      {r.evaluation?.rating ?? '-'}
                    </td>
                    <td className="p-2 text-left truncate max-w-[200px]">
                      {r.evaluation?.remarks || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

