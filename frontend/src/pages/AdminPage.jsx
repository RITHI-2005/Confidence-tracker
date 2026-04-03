import { useEffect, useState } from 'react';
import api from '../services/api';
import { CardSkeleton } from '../components/Skeleton';
import AdminMockTestReports from '../components/AdminMockTestReports';

export default function AdminPage() {
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [confidence, setConfidence] = useState({ logs: [], trends: [] });
  const [goals, setGoals] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/api/admin/dashboard'),
      api.get('/api/admin/users'),
      api.get('/api/admin/activities?limit=30'),
      api.get('/api/admin/confidence?limit=50'),
      api.get('/api/admin/goals'),
      api.get('/api/admin/skills')
    ])
      .then(([d, u, a, c, g, s]) => {
        setDashboard(d.data);
        setUsers(u.data);
        setActivities(a.data);
        setConfidence(c.data);
        setGoals(g.data);
        setSkills(s.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDeleteSkill = async (id) => {
    if (!confirm('Delete this skill?')) return;
    try {
      await api.delete(`/api/skills/${id}`);
      setSkills((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="font-display font-bold text-2xl mb-6">Admin Control Panel</h1>
        <CardSkeleton />
      </div>
    );
  }

  const filteredUsers = roleFilter ? users.filter((u) => u.role === roleFilter) : users;

  return (
    <div>
      <h1 className="font-display font-bold text-2xl mb-2">Admin Super Control Panel</h1>
      <p className="text-slate-500 mb-6">
        System overview, user management, activity monitor, skill monitor
      </p>

      {/* System Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-2xl font-bold text-slate-900">{dashboard?.totalUsers ?? 0}</div>
          <div className="text-sm text-slate-500">Total Users</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-2xl font-bold text-primary-600">{dashboard?.totalStudents ?? 0}</div>
          <div className="text-sm text-slate-500">Students</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-2xl font-bold text-emerald-600">{dashboard?.totalTeachers ?? 0}</div>
          <div className="text-sm text-slate-500">Teachers</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-2xl font-bold text-amber-600">{dashboard?.totalSkills ?? 0}</div>
          <div className="text-sm text-slate-500">Skills</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-2xl font-bold text-slate-900">{dashboard?.avgConfidence ?? '-'}</div>
          <div className="text-sm text-slate-500">Avg Confidence</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-2xl font-bold text-purple-600">{dashboard?.activeUsers ?? 0}</div>
          <div className="text-sm text-slate-500">Active (7d)</div>
        </div>
      </div>

      {/* User Management Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-8">
        <h2 className="font-semibold text-lg p-4 border-b flex items-center gap-4">
          User Management
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm"
          >
            <option value="">All roles</option>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
        </h2>
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Role</th>
                <th className="text-right p-3">Conf Logs</th>
                <th className="text-right p-3">Activities</th>
                <th className="text-right p-3">Goals</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredUsers.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50">
                  <td className="p-3">{u.name}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3 capitalize">{u.role}</td>
                  <td className="p-3 text-right">{u.confLogCount ?? 0}</td>
                  <td className="p-3 text-right">{u.activityCount ?? 0}</td>
                  <td className="p-3 text-right">{u.goalCount ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Monitor */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-8">
        <h2 className="font-semibold text-lg p-4 border-b">Activity Monitor (Recent)</h2>
        <div className="divide-y max-h-64 overflow-y-auto">
          {activities.length === 0 ? (
            <p className="p-4 text-slate-500">No activities</p>
          ) : (
            activities.slice(0, 20).map((a) => (
              <div key={a._id} className="p-4 flex justify-between text-sm">
                <span>{a.userId?.name} — {a.type}</span>
                <span className="text-slate-500">{a.skillId?.name || a.topicId?.name || a.title || '-'}</span>
                <span className="text-slate-400">{new Date(a.date).toLocaleDateString()}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confidence updates */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-8">
        <h2 className="font-semibold text-lg p-4 border-b">Recent Confidence Updates</h2>
        <div className="divide-y max-h-48 overflow-y-auto">
          {confidence.logs?.length === 0 ? (
            <p className="p-4 text-slate-500">No confidence logs</p>
          ) : (
            confidence.logs?.slice(0, 15).map((c) => (
              <div key={c._id} className="p-4 flex justify-between text-sm">
                <span>{c.userId?.name}</span>
                <span>{c.skillId?.name || c.topicId?.name || '-'}</span>
                <span className="font-medium">{c.confidenceLevel}/5</span>
                <span className="text-slate-400">{new Date(c.date).toLocaleDateString()}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Skill Monitor */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-8">
        <h2 className="font-semibold text-lg p-4 border-b">Skill Monitor (delete inappropriate)</h2>
        <div className="divide-y max-h-48 overflow-y-auto">
          {skills.length === 0 ? (
            <p className="p-4 text-slate-500">No skills</p>
          ) : (
            skills.map((s) => (
              <div key={s._id} className="p-4 flex justify-between items-center">
                <div>
                  <span className="font-medium">{s.name}</span>
                  {s.description && <span className="text-slate-500 text-sm ml-2">— {s.description}</span>}
                  {s.createdBy?.name && <span className="text-slate-400 text-xs block">by {s.createdBy.name}</span>}
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteSkill(s._id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mock Test Reports */}
      <div className="mt-8">
        <AdminMockTestReports users={users} />
      </div>
    </div>
  );
}
