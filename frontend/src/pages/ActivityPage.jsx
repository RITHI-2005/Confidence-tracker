import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { CardSkeleton } from '../components/Skeleton';

const TYPES = ['topic', 'assignment', 'quiz', 'test', 'study'];

export default function ActivityPage() {
  const { user } = useAuth();
  const [skills, setSkills] = useState([]);
  const [data, setData] = useState({ activities: [], totalStudyHours: 0, streak: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    type: 'study',
    skillId: '',
    title: '',
    studyHours: 0,
    score: '',
    maxScore: '',
    description: ''
  });

  useEffect(() => {
    Promise.all([
      api.get('/api/skills'),
      api.get(`/api/activity/user/${user?.id}?period=monthly`)
    ])
      .then(([s, a]) => {
        setSkills(s.data);
        setData(a.data);
        if (s.data.length) setForm((f) => ({ ...f, skillId: s.data[0]._id }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        skillId: form.skillId || undefined,
        studyHours: Number(form.studyHours) || 0,
        score: form.score ? Number(form.score) : undefined,
        maxScore: form.maxScore ? Number(form.maxScore) : undefined
      };
      await api.post('/api/activity/add', payload);
      const res = await api.get(`/api/activity/user/${user?.id}?period=monthly`);
      setData(res.data);
      setForm({
        type: 'study',
        skillId: skills[0]?._id || '',
        title: '',
        studyHours: 0,
        score: '',
        maxScore: '',
        description: ''
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="font-display font-bold text-2xl mb-6">Activity Logger</h1>
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display font-bold text-2xl mb-2">Activity Logger</h1>
      <p className="text-slate-500 mb-6">
        Log completed topics, assignments, quizzes. Total study hours: {data.totalStudyHours}h |
        Streak: {data.streak} days
      </p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
        <h2 className="font-semibold text-lg mb-4">Add Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg border border-slate-300"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Skill</label>
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg border border-slate-300"
              placeholder="e.g. Chapter 3 Quiz"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Study Hours</label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={form.studyHours}
              onChange={(e) => setForm((f) => ({ ...f, studyHours: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg border border-slate-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Score</label>
            <input
              type="number"
              value={form.score}
              onChange={(e) => setForm((f) => ({ ...f, score: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg border border-slate-300"
              placeholder="e.g. 85"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Max Score</label>
            <input
              type="number"
              value={form.maxScore}
              onChange={(e) => setForm((f) => ({ ...f, maxScore: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg border border-slate-300"
              placeholder="e.g. 100"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50"
        >
          {submitting ? 'Saving...' : 'Add Activity'}
        </button>
      </form>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <h2 className="font-semibold text-lg p-4 border-b">Recent Activities</h2>
        <div className="divide-y max-h-96 overflow-y-auto">
          {data.activities?.length === 0 ? (
            <p className="p-6 text-slate-500">No activities yet.</p>
          ) : (
            data.activities?.map((a) => (
              <div key={a._id} className="p-4 flex justify-between items-center">
                <div>
                  <span className="font-medium capitalize">{a.type}</span>
                  <span className="text-slate-600 ml-2">{a.title || a.skillId?.name || a.topicId?.name || '-'}</span>
                  <span className="text-slate-400 text-sm ml-2">
                    {new Date(a.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex gap-3">
                  {a.studyHours > 0 && (
                    <span className="text-amber-600">{a.studyHours}h</span>
                  )}
                  {a.score != null && a.maxScore && (
                    <span className="text-primary-600">
                      {a.score}/{a.maxScore}
                    </span>
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
