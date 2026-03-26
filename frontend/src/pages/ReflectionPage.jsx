import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { CardSkeleton } from '../components/Skeleton';
import { BookOpen, Smile, Meh, Frown, TrendingUp, HelpCircle, FileText, AlertCircle, Clock } from 'lucide-react';

const MOODS = ['Happy', 'Neutral', 'Stressed'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const MoodIcon = ({ mood, size = 16, className = "" }) => {
  if (mood === 'Happy') return <Smile size={size} className={className} />;
  if (mood === 'Stressed') return <Frown size={size} className={className} />;
  return <Meh size={size} className={className} />;
};

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
      <div className="w-full max-w-5xl mx-auto">
        <h1 className="font-display font-bold text-3xl mb-8 text-slate-800 dark:text-white">Reflection</h1>
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl mb-2 text-slate-900 dark:text-white flex items-center gap-3">
          <BookOpen className="text-cyan-500" size={32} />
          Reflection & Feedback
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Share your thoughts, mood, and self-assessment after learning to build self-awareness
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 lg:p-8 mb-10">
        <h2 className="font-semibold text-xl mb-6 text-slate-800 dark:text-slate-200">New Reflection</h2>
        <div className="space-y-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Your Thoughts</label>
            <textarea
              value={form.reflectionText}
              onChange={(e) => setForm((f) => ({ ...f, reflectionText: e.target.value }))}
              className="w-full px-4 py-4 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500 outline-none transition-all placeholder-slate-400 min-h-[120px] resize-y"
              placeholder="What did you learn today? What was confusing? How do you feel about your progress?"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Skill / Topic</label>
              <select
                value={form.skillId}
                onChange={(e) => setForm((f) => ({ ...f, skillId: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
              >
                <option value="">— General —</option>
                {skills.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Mood</label>
              <div className="relative">
                <select
                  value={form.mood}
                  onChange={(e) => setForm((f) => ({ ...f, mood: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500 outline-none transition-all appearance-none"
                >
                  {MOODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <MoodIcon mood={form.mood} size={18} />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Difficulty</label>
              <div className="relative">
                <select
                  value={form.difficulty}
                  onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500 outline-none transition-all appearance-none"
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <HelpCircle size={18} />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Self Assessment (1-5)
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, selfAssessment: n }))}
                    className={`flex-1 h-12 rounded-xl font-bold transition-all duration-200 ${
                      form.selfAssessment === n
                        ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30 scale-105'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-dark-bg dark:text-slate-400 dark:hover:bg-dark-border dark:border dark:border-dark-border'
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
          className="w-full md:w-auto px-8 py-3 rounded-xl bg-cyan-600 text-white font-semibold hover:bg-cyan-700 active:scale-95 transition-all disabled:opacity-50 shadow-md shadow-cyan-600/20"
        >
          {submitting ? 'Saving...' : 'Submit Reflection'}
        </button>
      </form>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-200/50 dark:border-dark-border bg-slate-50/50 dark:bg-dark-card/50 flex items-center justify-between">
          <h2 className="font-semibold text-xl text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <FileText size={20} className="text-cyan-500" />
            Reflection History
          </h2>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-dark-border max-h-[500px] overflow-y-auto w-full">
          {reflections.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <AlertCircle size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">No reflections yet.</p>
              <p className="text-slate-400 mt-1">Take a moment to write your first reflection above.</p>
            </div>
          ) : (
            reflections.map((r) => (
              <div key={r._id} className="p-6 hover:bg-slate-50/50 dark:hover:bg-dark-bg/30 transition-colors">
                <div className="mb-4">
                  <p className="text-slate-800 dark:text-slate-200 text-lg leading-relaxed whitespace-pre-wrap">"{r.reflectionText}"</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold ${
                      r.mood === 'Happy'
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/30'
                        : r.mood === 'Stressed'
                        ? 'bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/30'
                        : 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-dark-border'
                    }`}
                  >
                    <MoodIcon mood={r.mood} />
                    {r.mood}
                  </span>
                  
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-dark-border">
                    <HelpCircle size={16} />
                    {r.difficulty || 'Medium'}
                  </span>
                  
                  {r.selfAssessment && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-cyan-50 text-cyan-700 border border-cyan-100 dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-800/30">
                      <TrendingUp size={16} />
                      {r.selfAssessment}/5 Self Assessment
                    </span>
                  )}
                  
                  <span className="ml-auto flex items-center gap-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                    <Clock size={14} />
                    {new Date(r.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
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
