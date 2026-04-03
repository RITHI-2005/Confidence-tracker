import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { CardSkeleton } from '../components/Skeleton';

const MOODS = ['Happy', 'Neutral', 'Stressed'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export default function ReflectionPage() {
  const { user } = useAuth();
  const [skills, setSkills] = useState([]);
  const [reflections, setReflections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    reflectionText: '',
    mood: 'Neutral',
    difficulty: 'Medium',
    selfAssessment: 3,
    skillId: ''
  });

  useEffect(() => {
    Promise.all([
      api.get('/api/skills'),
      api.get(`/api/reflection/user/${user?.id}`)
    ])
      .then(([s, r]) => {
        setSkills(s.data);
        setReflections(r.data);
        if (s.data.length) setForm((f) => ({ ...f, skillId: s.data[0]._id }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/reflection/add', {
        ...form,
        skillId: form.skillId || undefined
      });
      const { data } = await api.get(`/api/reflection/user/${user?.id}`);
      setReflections(data);
      setForm({
        reflectionText: '',
        mood: 'Neutral',
        difficulty: 'Medium',
        selfAssessment: 3,
        skillId: skills[0]?._id || ''
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="font-display font-bold text-2xl mb-6">Reflection</h1>
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display font-bold text-2xl mb-2">Reflection & Feedback</h1>
      <p className="text-slate-500 mb-6">
        Share your thoughts, mood, and self-assessment after learning
      </p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
        <h2 className="font-semibold text-lg mb-4">Add Reflection</h2>
        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reflection</label>
            <textarea
              value={form.reflectionText}
              onChange={(e) => setForm((f) => ({ ...f, reflectionText: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 min-h-[100px]"
              placeholder="What did you learn? How do you feel?"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Mood</label>
              <select
                value={form.mood}
                onChange={(e) => setForm((f) => ({ ...f, mood: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-slate-300"
              >
                {MOODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Difficulty</label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-slate-300"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Self Assessment (1-5)
              </label>
              <div className="flex gap-2 mt-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, selfAssessment: n }))}
                    className={`w-10 h-10 rounded-lg font-semibold transition ${
                      form.selfAssessment === n
                        ? 'bg-primary-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50"
        >
          {submitting ? 'Saving...' : 'Submit Reflection'}
        </button>
      </form>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <h2 className="font-semibold text-lg p-4 border-b">Past Reflections</h2>
        <div className="divide-y max-h-[500px] overflow-y-auto">
          {reflections.length === 0 ? (
            <p className="p-6 text-slate-500">No reflections yet.</p>
          ) : (
            reflections.map((r) => (
              <div key={r._id} className="p-4">
                <p className="text-slate-800">{r.reflectionText}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      r.mood === 'Happy'
                        ? 'bg-green-100 text-green-700'
                        : r.mood === 'Stressed'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {r.mood}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs bg-slate-100">{r.difficulty}</span>
                  {r.selfAssessment && (
                    <span className="px-2 py-0.5 rounded text-xs bg-primary-100">
                      {r.selfAssessment}/5
                    </span>
                  )}
                  <span className="text-slate-400 text-xs">
                    {new Date(r.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
