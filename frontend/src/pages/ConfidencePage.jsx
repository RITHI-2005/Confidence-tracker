import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { CardSkeleton } from '../components/Skeleton';
import { Target, TrendingUp, Calendar, AlertCircle } from 'lucide-react';

export default function ConfidencePage() {
  const { user } = useAuth();
  const [skills, setSkills] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ skillId: '', confidenceLevel: 3, notes: '' });

  useEffect(() => {
    Promise.all([
      api.get('/api/skills'),
      api.get(`/api/confidence/user/${user?.id}?period=monthly`)
    ])
      .then(([s, c]) => {
        setSkills(s.data);
        setLogs(c.data);
        if (s.data.length) setForm((f) => ({ ...f, skillId: s.data[0]._id }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.skillId) return;
    setSubmitting(true);
    try {
      await api.post('/api/confidence/add', { ...form, skillId: form.skillId });
      const skill = skills.find((s) => s._id === form.skillId);
      setLogs((prev) => [
        {
          _id: Date.now(),
          skillId: skill,
          confidenceLevel: form.confidenceLevel,
          notes: form.notes,
          date: new Date()
        },
        ...prev
      ]);
      setForm((f) => ({ ...f, confidenceLevel: 3, notes: '' }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <h1 className="font-display font-bold text-3xl mb-8 text-slate-800 dark:text-white">Confidence Tracker</h1>
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl mb-2 text-slate-900 dark:text-white flex items-center gap-3">
          <TrendingUp className="text-primary-500" size={32} />
          Confidence Tracker
        </h1>
        <p className="text-slate-500 dark:text-slate-400">Rate your confidence (1-5) after each topic or session to track your growth.</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 lg:p-8 mb-8">
        <h2 className="font-semibold text-xl mb-6 text-slate-800 dark:text-slate-200">Log New Confidence Level</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Skill / Topic</label>
            <select
              value={form.skillId}
              onChange={(e) => setForm((f) => ({ ...f, skillId: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              required
            >
              <option value="">Select skill</option>
              {skills.length === 0 && <option value="" disabled>No skills yet — ask teacher to add</option>}
              {skills.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Confidence (1-5)</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, confidenceLevel: n }))}
                  className={`flex-1 h-12 rounded-xl font-bold text-lg transition-all duration-200 ${
                    form.confidenceLevel === n
                      ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30 scale-105'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-dark-bg dark:text-slate-400 dark:hover:bg-dark-border dark:border dark:border-dark-border'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-2 px-1">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Notes (optional)</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500"
              placeholder="How did it go?"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full md:w-auto px-8 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 shadow-md shadow-primary-600/20"
        >
          {submitting ? 'Saving...' : 'Add Log'}
        </button>
      </form>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-200/50 dark:border-dark-border bg-slate-50/50 dark:bg-dark-card/50 flex items-center justify-between">
          <h2 className="font-semibold text-xl text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Target size={20} className="text-primary-500" />
            Recent Logs
          </h2>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-dark-border max-h-[500px] overflow-y-auto">
          {logs.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <AlertCircle size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">No confidence logs yet.</p>
              <p className="text-slate-400 dark:text-slate-500 mt-1">Start by logging your confidence above.</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log._id} className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:bg-slate-50/50 dark:hover:bg-dark-bg/30 transition-colors">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-lg">
                    {log.skillId?.name || log.topicId?.name || 'Unknown Topic'}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-1.5">
                    <Calendar size={14} />
                    {new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex flex-row-reverse sm:flex-row items-center justify-end gap-3 w-full sm:w-auto">
                  {log.notes && (
                    <span className="text-slate-500 dark:text-slate-400 text-sm italic truncate max-w-[200px] lg:max-w-xs bg-slate-100 dark:bg-dark-bg px-3 py-1.5 rounded-lg border border-slate-200 dark:border-dark-border shadow-sm">
                      "{log.notes}"
                    </span>
                  )}
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-xl text-lg font-bold shadow-sm ${
                      log.confidenceLevel <= 2
                        ? 'bg-rose-100/80 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50'
                        : log.confidenceLevel >= 4
                        ? 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                        : 'bg-amber-100/80 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50'
                    }`}
                  >
                    {log.confidenceLevel}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
