import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { CardSkeleton } from '../components/Skeleton';

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
      <div>
        <h1 className="font-display font-bold text-2xl mb-6">Confidence Tracker</h1>
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display font-bold text-2xl mb-2">Confidence Tracker</h1>
      <p className="text-slate-500 mb-6">Rate your confidence (1-5) after each topic or session</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
        <h2 className="font-semibold text-lg mb-4">Log Confidence</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Skill</label>
            <select
              value={form.skillId}
              onChange={(e) => setForm((f) => ({ ...f, skillId: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg border border-slate-300"
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Confidence (1-5)</label>
            <div className="flex gap-2 mt-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, confidenceLevel: n }))}
                  className={`w-10 h-10 rounded-lg font-semibold transition ${
                    form.confidenceLevel === n
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes (optional)</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg border border-slate-300"
              placeholder="Any notes..."
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50"
        >
          {submitting ? 'Saving...' : 'Add Log'}
        </button>
      </form>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <h2 className="font-semibold text-lg p-4 border-b">Recent Logs</h2>
        <div className="divide-y max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="p-6 text-slate-500">No confidence logs yet.</p>
          ) : (
            logs.map((log) => (
              <div key={log._id} className="p-4 flex justify-between items-center">
                <div>
                  <span className="font-medium">{log.skillId?.name || log.topicId?.name || 'Unknown'}</span>
                  <span className="text-slate-500 text-sm ml-2">
                    {new Date(log.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-sm font-medium ${
                      log.confidenceLevel <= 2
                        ? 'bg-red-100 text-red-700'
                        : log.confidenceLevel >= 4
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {log.confidenceLevel}/5
                  </span>
                  {log.notes && (
                    <span className="text-slate-500 text-sm truncate max-w-[150px]">{log.notes}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
