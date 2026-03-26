import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { CardSkeleton } from '../components/Skeleton';
import { Activity, Clock, Flame, BookOpen, CheckCircle, FileText, Target, AlertCircle } from 'lucide-react';

const TYPES = ['topic', 'assignment', 'quiz', 'test', 'study'];

const TypeIcon = ({ type, size = 18 }) => {
  switch (type) {
    case 'study': return <BookOpen size={size} />;
    case 'assignment': return <FileText size={size} />;
    case 'quiz': return <CheckCircle size={size} />;
    case 'test': return <Target size={size} />;
    default: return <Activity size={size} />;
  }
};

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
      <div className="w-full max-w-5xl mx-auto">
        <h1 className="font-display font-bold text-3xl mb-8 text-slate-800 dark:text-white">Activity Logger</h1>
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl mb-4 text-slate-900 dark:text-white flex items-center gap-3">
          <Activity className="text-emerald-500" size={32} />
          Activity Logger
        </h1>
        
        <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
            <Clock size={16} /> Total Study Hours: <span className="text-lg font-bold">{data.totalStudyHours}h</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
            <Flame size={16} className={data.streak > 0 ? "text-orange-500" : "text-slate-400"} /> Streak: <span className="text-lg font-bold">{data.streak} days</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 lg:p-8 mb-8">
        <h2 className="font-semibold text-xl mb-6 text-slate-800 dark:text-slate-200">Log New Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all capitalize"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Skill / Topic</label>
            <select
              value={form.skillId}
              onChange={(e) => setForm((f) => ({ ...f, skillId: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            >
              <option value="">— General —</option>
              {skills.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500"
              placeholder="e.g. Completed Chapter 3"
            />
          </div>
          
          <div className="lg:col-span-2 flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Study Hours</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={form.studyHours}
                onChange={(e) => setForm((f) => ({ ...f, studyHours: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
          </div>
          <div className="lg:col-span-2 flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Score</label>
              <input
                type="number"
                value={form.score}
                onChange={(e) => setForm((f) => ({ ...f, score: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder-slate-400"
                placeholder="0"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Max Score</label>
              <input
                type="number"
                value={form.maxScore}
                onChange={(e) => setForm((f) => ({ ...f, maxScore: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder-slate-400"
                placeholder="100"
              />
            </div>
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full md:w-auto px-8 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50 shadow-md shadow-emerald-600/20"
        >
          {submitting ? 'Saving...' : 'Log Activity'}
        </button>
      </form>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-200/50 dark:border-dark-border bg-slate-50/50 dark:bg-dark-card/50 flex items-center justify-between">
          <h2 className="font-semibold text-xl text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Clock size={20} className="text-emerald-500" />
            Recent Activities
          </h2>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-dark-border max-h-[500px] overflow-y-auto w-full">
          {data.activities?.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <AlertCircle size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">No activities yet.</p>
              <p className="text-slate-400 mt-1">Start by logging your study time or quiz scores above.</p>
            </div>
          ) : (
            data.activities?.map((a) => (
              <div key={a._id} className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-dark-bg/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl shrink-0 mt-1 ${
                    a.type === 'study' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                    a.type === 'quiz' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                    a.type === 'assignment' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                    a.type === 'test' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' :
                    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    <TypeIcon type={a.type} size={24} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-lg capitalize">{a.type}</span>
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      {a.title || a.skillId?.name || a.topicId?.name || 'General Activity'}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                      {new Date(a.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 sm:gap-6 ml-14 sm:ml-0 bg-slate-50 dark:bg-dark-bg p-3 rounded-xl border border-slate-100 dark:border-dark-border sm:bg-transparent sm:border-transparent sm:p-0">
                  {a.studyHours > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30">
                      <Clock size={16} />
                      <span className="font-bold">{a.studyHours}h</span>
                    </div>
                  )}
                  {a.score != null && a.maxScore && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30">
                      <Target size={16} />
                      <span className="font-bold">{a.score}/{a.maxScore}</span>
                      <span className="text-xs font-semibold ml-1 opacity-80">
                        ({Math.round((a.score / a.maxScore) * 100)}%)
                      </span>
                    </div>
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
