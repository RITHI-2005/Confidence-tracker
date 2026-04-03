import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { CardSkeleton } from '../components/Skeleton';

export default function GoalsPage() {
  const { user } = useAuth();
  const [skills, setSkills] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'short-term', targetDate: '', skillId: '' });

  useEffect(() => {
    Promise.all([
      api.get('/api/skills'),
      api.get(`/api/goals/user/${user?.id}`)
    ])
      .then(([s, g]) => {
        setSkills(s.data);
        setGoals(g.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/goals/add', {
        ...form,
        targetDate: form.targetDate || undefined,
        skillId: form.skillId || undefined
      });
      const { data } = await api.get(`/api/goals/user/${user?.id}`);
      setGoals(data);
      setForm({ title: '', description: '', type: 'short-term', targetDate: '', skillId: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const updateProgress = async (id, progress, completed) => {
    try {
      await api.put(`/api/goals/${id}`, { progress, completed });
      const { data } = await api.get(`/api/goals/user/${user?.id}`);
      setGoals(data);
    } catch (err) {
      alert('Failed to update');
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="font-display font-bold text-2xl mb-6">Goals</h1>
        <CardSkeleton />
      </div>
    );
  }

  const completed = goals.filter((g) => g.completed).length;
  const total = goals.length;
  const pct = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div>
      <h1 className="font-display font-bold text-2xl mb-2">Goals</h1>
      <p className="text-slate-500 mb-6">
        Set and track short-term and long-term goals. Completion: {completed}/{total} ({pct}%)
      </p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
        <h2 className="font-semibold text-lg mb-4">Add Goal</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg border border-slate-300"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Skill (optional)</label>
            <select
              value={form.skillId}
              onChange={(e) => setForm((f) => ({ ...f, skillId: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg border border-slate-300"
            >
              <option value="">—</option>
              {skills.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg border border-slate-300"
            >
              <option value="short-term">Short-term</option>
              <option value="long-term">Long-term</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Target Date</label>
            <input
              type="date"
              value={form.targetDate}
              onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg border border-slate-300"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg border border-slate-300"
              placeholder="Optional"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50"
        >
          {submitting ? 'Adding...' : 'Add Goal'}
        </button>
      </form>

      <div className="space-y-4">
        {goals.length === 0 ? (
          <p className="p-6 bg-white rounded-xl border text-slate-500">No goals yet.</p>
        ) : (
          goals.map((g) => (
            <div
              key={g._id}
              className={`p-6 rounded-xl border ${
                g.completed ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{g.title}</h3>
                  <span className="text-xs text-slate-500 capitalize">{g.type}</span>
                  {g.targetDate && (
                    <span className="text-xs text-slate-500 ml-2">
                      Target: {new Date(g.targetDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {!g.completed && (
                  <button
                    onClick={() => updateProgress(g._id, 100, true)}
                    className="text-sm text-primary-600 hover:underline"
                  >
                    Mark complete
                  </button>
                )}
                {g.completed && (
                  <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-sm">
                    Done
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition"
                    style={{ width: `${g.progress}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-12">{g.progress}%</span>
              </div>
              <div className="flex gap-2 mt-2">
                {[0, 25, 50, 75, 100].map(
                  (n) =>
                    !g.completed && (
                      <button
                        key={n}
                        onClick={() => updateProgress(g._id, n)}
                        className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200"
                      >
                        {n}%
                      </button>
                    )
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
