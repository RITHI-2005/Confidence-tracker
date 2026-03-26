import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { CardSkeleton } from '../components/Skeleton';
import { Target, Flag, CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';

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

  const updateProgress = async (id, progress, completed = false) => {
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
      <div className="w-full max-w-5xl mx-auto">
        <h1 className="font-display font-bold text-3xl mb-8 text-slate-800 dark:text-white">Goals</h1>
        <CardSkeleton />
      </div>
    );
  }

  const completed = goals.filter((g) => g.completed).length;
  const total = goals.length;
  const pct = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl mb-4 text-slate-900 dark:text-white flex items-center gap-3">
          <Target className="text-purple-500" size={32} />
          Goals
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
          <p className="text-slate-500 dark:text-slate-400 mr-2">
            Set and track short-term and long-term goals.
          </p>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
            <CheckCircle2 size={16} /> Completion: 
            <span className="text-lg font-bold">{completed}/{total}</span>
            <span className="text-sm opacity-80">({pct}%)</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 lg:p-8 mb-10">
        <h2 className="font-semibold text-xl mb-6 text-slate-800 dark:text-slate-200">Add New Goal</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all placeholder-slate-400"
              placeholder="e.g. Master React Hooks"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Skill (optional)</label>
            <select
              value={form.skillId}
              onChange={(e) => setForm((f) => ({ ...f, skillId: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
            >
              <option value="">— General —</option>
              {skills.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
            >
              <option value="short-term">Short-term</option>
              <option value="long-term">Long-term</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Target Date (optional)</label>
            <input
              type="date"
              value={form.targetDate}
              onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description (optional)</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all placeholder-slate-400"
              placeholder="Why this goal?"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full md:w-auto px-8 py-3 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 active:scale-95 transition-all disabled:opacity-50 shadow-md shadow-purple-600/20"
        >
          {submitting ? 'Adding...' : 'Add Goal'}
        </button>
      </form>

      <div className="space-y-4">
        <h2 className="font-semibold text-xl mb-4 text-slate-800 dark:text-slate-200">Your Goals</h2>
        {goals.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center flex flex-col items-center justify-center">
            <AlertCircle size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">No goals yet.</p>
            <p className="text-slate-400 mt-1">Start by adding your first goal above to track your progress.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {goals.map((g) => (
              <div
                key={g._id}
                className={`flex flex-col p-6 rounded-2xl border transition-all duration-300 ${
                  g.completed 
                    ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800/30' 
                    : 'glass-card hover:-translate-y-1'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="pr-4">
                    <h3 className={`font-semibold text-xl mb-1 ${g.completed ? 'text-emerald-800 dark:text-emerald-400 line-through opacity-70' : 'text-slate-900 dark:text-slate-100'}`}>
                      {g.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize flex items-center gap-1 ${
                        g.type === 'long-term' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400'
                      }`}>
                        <Flag size={12} />
                        {g.type}
                      </span>
                      {g.targetDate && (
                        <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                          <Clock size={12} />
                          Target: {new Date(g.targetDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    {g.completed ? (
                      <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-sm font-bold shadow-sm">
                        <CheckCircle2 size={16} />
                        Done
                      </span>
                    ) : (
                      <button
                        onClick={() => updateProgress(g._id, 100, true)}
                        className="flex justify-center items-center w-10 h-10 rounded-full bg-slate-100 hover:bg-emerald-100 text-slate-400 hover:text-emerald-600 dark:bg-dark-bg dark:border dark:border-dark-border dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400 dark:hover:border-emerald-800/50 transition-colors"
                        title="Mark complete"
                      >
                        <Circle size={24} />
                      </button>
                    )}
                  </div>
                </div>
                
                {g.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 flex-1 italic">
                    {g.description}
                  </p>
                )}
                
                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-dark-border">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Progress</span>
                    <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{g.progress}%</span>
                  </div>
                  <div className="h-3 bg-slate-100 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-full overflow-hidden mb-4">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out ${
                        g.completed ? 'bg-emerald-500' : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                      }`}
                      style={{ width: `${g.progress}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[0, 25, 50, 75, 100].map(
                      (n) =>
                        !g.completed && (
                          <button
                            key={n}
                            onClick={() => updateProgress(g._id, n, n === 100)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors border ${
                              g.progress === n 
                                ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/50 shadow-sm' 
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-dark-bg dark:text-slate-400 dark:border-dark-border dark:hover:bg-dark-card'
                            }`}
                          >
                            {n}%
                          </button>
                        )
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
