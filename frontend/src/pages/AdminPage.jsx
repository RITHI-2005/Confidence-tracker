import { useEffect, useState } from 'react';
import api from '../services/api';
import { CardSkeleton } from '../components/Skeleton';
import AdminMockTestReports from '../components/AdminMockTestReports';
import { Settings, Users, LineChart, Brain, Activity, Trash2, TrendingUp } from 'lucide-react';

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
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <h1 className="font-display font-bold text-3xl text-slate-900 dark:text-white flex items-center gap-3">
          <Settings className="text-primary-500" size={32} />
          Super Admin Control Panel
        </h1>
        <CardSkeleton />
      </div>
    );
  }

  const filteredUsers = roleFilter ? users.filter((u) => u.role === roleFilter) : users;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="font-display font-bold text-3xl mb-2 text-slate-900 dark:text-white flex items-center gap-3">
          <Settings className="text-primary-500" size={32} />
          Super Admin Control Panel
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Global system overview, user management, activity monitor, and mock test reports.
        </p>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Users', value: dashboard?.totalUsers ?? 0, color: 'text-slate-700 dark:text-slate-200', bg: 'bg-slate-50 dark:bg-dark-card border-slate-200 dark:border-dark-border' },
          { label: 'Students', value: dashboard?.totalStudents ?? 0, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-900/20 border-primary-100 dark:border-primary-800/30' },
          { label: 'Teachers', value: dashboard?.totalTeachers ?? 0, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30' },
          { label: 'Skills', value: dashboard?.totalSkills ?? 0, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/30' },
          { label: 'Avg Confidence', value: dashboard?.avgConfidence ?? '-', color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-900/20 border-sky-100 dark:border-sky-800/30' },
          { label: 'Active (7d)', value: dashboard?.activeUsers ?? 0, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800/30' },
        ].map((stat, idx) => (
          <div key={idx} className={`p-5 rounded-2xl border backdrop-blur-sm ${stat.bg} flex flex-col items-center justify-center text-center transition-transform hover:scale-105`}>
            <div className={`text-3xl font-display font-bold mb-1 ${stat.color}`}>{stat.value}</div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 space-y-8">
          {/* User Management Table */}
          <div className="glass-card rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-dark-border">
            <h2 className="font-semibold text-lg p-5 border-b border-slate-200 dark:border-dark-border bg-slate-50/50 dark:bg-dark-card/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-slate-800 dark:text-slate-200">
              <div className="flex items-center gap-2">
                <Users className="text-primary-500" size={20} />
                User Management
              </div>
              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                >
                  <option value="">All roles</option>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </h2>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-dark-bg sticky top-0 z-10 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-dark-border font-semibold">
                  <tr>
                    <th className="text-left p-4 whitespace-nowrap">User</th>
                    <th className="text-left p-4 whitespace-nowrap">Role</th>
                    <th className="text-right p-4 whitespace-nowrap">Logs</th>
                    <th className="text-right p-4 whitespace-nowrap">Acts</th>
                    <th className="text-right p-4 whitespace-nowrap">Goals</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-border bg-white dark:bg-dark-card">
                  {filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50/50 dark:hover:bg-dark-bg/50 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{u.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{u.email}</div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-semibold capitalize ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                          u.role === 'teacher' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 text-right font-medium text-slate-600 dark:text-slate-300">{u.confLogCount ?? 0}</td>
                      <td className="p-4 text-right font-medium text-slate-600 dark:text-slate-300">{u.activityCount ?? 0}</td>
                      <td className="p-4 text-right font-medium text-slate-600 dark:text-slate-300">{u.goalCount ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <AdminMockTestReports users={users} />
        </div>

        <div className="xl:col-span-4 space-y-8">
          {/* Activity Monitor */}
          <div className="glass-card rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-dark-border">
            <h2 className="font-semibold text-lg p-5 border-b border-slate-200 dark:border-dark-border bg-slate-50/50 dark:bg-dark-card/50 flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <Activity className="text-primary-500" size={20} />
              Recent Activity
            </h2>
            <div className="divide-y divide-slate-100 dark:divide-dark-border max-h-80 overflow-y-auto bg-white dark:bg-dark-card p-2">
              {activities.length === 0 ? (
                <p className="p-8 text-center text-slate-500 dark:text-slate-400">No activities recorded</p>
              ) : (
                activities.slice(0, 20).map((a) => (
                  <div key={a._id} className="p-3 text-sm hover:bg-slate-50 dark:hover:bg-dark-bg/50 rounded-lg transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{a.userId?.name}</span>
                      <span className="text-xs text-slate-400 shrink-0 ml-2">{new Date(a.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium uppercase tracking-wider text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-1.5 py-0.5 rounded">{a.type}</span>
                      <span className="text-slate-600 dark:text-slate-300 truncate">{a.skillId?.name || a.topicId?.name || a.title || '-'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Confidence updates */}
          <div className="glass-card rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-dark-border">
            <h2 className="font-semibold text-lg p-5 border-b border-slate-200 dark:border-dark-border bg-slate-50/50 dark:bg-dark-card/50 flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <TrendingUp className="text-primary-500" size={20} />
              Recent Confidence Updates
            </h2>
            <div className="divide-y divide-slate-100 dark:divide-dark-border max-h-80 overflow-y-auto bg-white dark:bg-dark-card p-2">
              {confidence.logs?.length === 0 ? (
                <p className="p-8 text-center text-slate-500 dark:text-slate-400">No confidence logs</p>
              ) : (
                confidence.logs?.slice(0, 15).map((c) => (
                  <div key={c._id} className="p-3 text-sm hover:bg-slate-50 dark:hover:bg-dark-bg/50 rounded-lg transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{c.userId?.name}</span>
                      <span className="text-xs text-slate-400">{new Date(c.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-300 truncate mr-2">{c.skillId?.name || c.topicId?.name || '-'}</span>
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-dark-bg px-2 py-0.5 rounded-full w-fit">
                        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shrink-0">
                          <div 
                            className={`h-full rounded-full ${c.confidenceLevel >= 4 ? 'bg-emerald-500' : c.confidenceLevel <= 2 ? 'bg-rose-500' : 'bg-amber-500'}`}
                            style={{ width: `${(c.confidenceLevel / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{c.confidenceLevel}/5</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Skill Monitor */}
          <div className="glass-card rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-dark-border">
            <h2 className="font-semibold text-lg p-5 border-b border-slate-200 dark:border-dark-border bg-slate-50/50 dark:bg-dark-card/50 flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <Brain className="text-primary-500" size={20} />
              Skill Monitor
            </h2>
            <div className="divide-y divide-slate-100 dark:divide-dark-border max-h-80 overflow-y-auto bg-white dark:bg-dark-card p-2">
              {skills.length === 0 ? (
                <p className="p-8 text-center text-slate-500 dark:text-slate-400">No skills defined</p>
              ) : (
                skills.map((s) => (
                  <div key={s._id} className="p-3 hover:bg-slate-50 dark:hover:bg-dark-bg/50 rounded-lg transition-colors flex justify-between items-center group">
                    <div className="min-w-0 pr-2">
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate">{s.name}</div>
                      {s.createdBy?.name && <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">By {s.createdBy.name}</div>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteSkill(s._id)}
                      className="text-red-500 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                      title="Delete Skill"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
