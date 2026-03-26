import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { CardSkeleton } from '../components/Skeleton';
import { Activity, TrendingUp, TrendingDown, Target, Brain, Award, BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [weekly, setWeekly] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [recommendations, setRecommendations] = useState({ weakTopics: [], strongTopics: [] });
  const [confidenceTrends, setConfidenceTrends] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get(`/api/report/weekly/${user?.id}`),
      api.get(`/api/report/monthly/${user?.id}`),
      api.get(`/api/topics/recommendations/${user?.id}`),
      api.get(`/api/confidence/trends/${user?.id}`)
    ])
      .then(([w, m, r, t]) => {
        setWeekly(w.data);
        setMonthly(m.data);
        setRecommendations(r.data);
        const byTopic = t.data?.byTopic || [];
        const chartData = byTopic.flatMap((t) =>
          t.data.map((d) => ({
            name: t.topic,
            date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            level: d.level
          }))
        );
        setConfidenceTrends(chartData.slice(-30));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto">
        <h1 className="font-display font-bold text-3xl mb-8 text-slate-800 dark:text-white">Analytics Dashboard</h1>
        <CardSkeleton />
      </div>
    );
  }

  const weeklyConfData =
    weekly?.confidenceLogs?.reduce((acc, c) => {
      const d = new Date(c.date).toLocaleDateString('en-US', { weekday: 'short' });
      const i = acc.findIndex((x) => x.date === d);
      if (i >= 0) {
        acc[i].total += c.confidenceLevel;
        acc[i].count++;
      } else acc.push({ date: d, total: c.confidenceLevel, count: 1 });
      return acc;
    }, [])?.map((x) => ({ ...x, avg: Number((x.total / x.count).toFixed(1)) })) || [];

  const topicStats = monthly?.topicStats || [];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="font-display font-bold text-3xl mb-2 text-slate-900 dark:text-white flex items-center gap-3">
          <BarChart3 className="text-primary-500" size={32} />
          Analytics Dashboard
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Visualize your learning progress, identify patterns, and target areas for improvement.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="glass-card rounded-2xl p-6 lg:p-8">
          <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-primary-500" />
            Weekly Confidence Trend
          </h3>
          {weeklyConfData.length > 0 ? (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyConfData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700/50" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'currentColor' }} className="text-slate-500 dark:text-slate-400" axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 12, fill: 'currentColor' }} className="text-slate-500 dark:text-slate-400" axisLine={false} tickLine={false} tickCount={6} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', background: 'var(--tw-prose-invert, #fff)' }}
                    itemStyle={{ color: '#6366f1', fontWeight: 600 }}
                  />
                  <Line type="monotone" dataKey="avg" name="Avg Confidence" stroke="#6366f1" strokeWidth={3} dot={{ r: 5, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[260px] flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-dark-bg/30 rounded-xl border border-dashed border-slate-200 dark:border-dark-border">
              <Activity size={32} className="mb-2 opacity-50" />
              <p>No confidence data for this week</p>
            </div>
          )}
        </div>

        <div className="glass-card rounded-2xl p-6 lg:p-8">
          <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
            <Target size={20} className="text-primary-500" />
            Topic Performance (Monthly)
          </h3>
          {topicStats.length > 0 ? (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topicStats} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700/50" horizontal={false} />
                  <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 12, fill: 'currentColor' }} className="text-slate-500 dark:text-slate-400" axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="topicName" width={100} tick={{ fontSize: 11, fill: 'currentColor' }} className="text-slate-600 dark:text-slate-300 font-medium" axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', background: 'var(--tw-prose-invert, #fff)' }}
                    itemStyle={{ color: '#6366f1', fontWeight: 600 }}
                    cursor={{fill: 'currentColor', className:'text-slate-100 dark:text-slate-800/50'}}
                  />
                  <Bar dataKey="avgConfidence" name="Avg Confidence" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[260px] flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-dark-bg/30 rounded-xl border border-dashed border-slate-200 dark:border-dark-border">
              <Brain size={32} className="mb-2 opacity-50" />
              <p>No topic data yet for this month</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden group hover:border-amber-200 dark:hover:border-amber-900/50 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          <h3 className="font-semibold text-lg text-amber-600 dark:text-amber-500 mb-6 flex items-center gap-2">
            <TrendingDown size={20} />
            Focus Areas (Needs Revision)
          </h3>
          {recommendations.weakTopics?.length > 0 ? (
            <ul className="space-y-3 z-10 relative">
              {recommendations.weakTopics.slice(0, 5).map((w) => (
                <li key={w.topicId} className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                  <span className="font-medium text-slate-800 dark:text-slate-200">{w.topic?.name || 'Unknown Topic'}</span>
                  <div className="flex gap-3 text-sm font-semibold text-amber-700 dark:text-amber-400">
                    <span className="flex items-center gap-1 bg-white dark:bg-dark-bg px-2 py-1 rounded-md shadow-sm border border-amber-50 dark:border-amber-900/40">
                      Conf: {w.avgConfidence?.toFixed(1)}/5
                    </span>
                    <span className="flex items-center gap-1 bg-white dark:bg-dark-bg px-2 py-1 rounded-md shadow-sm border border-amber-50 dark:border-amber-900/40">
                      Score: {w.avgScore?.toFixed(0) || '-'}%
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center text-amber-700 dark:text-amber-500/70 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-dashed border-amber-200 dark:border-amber-900/30">
              <p className="font-medium">No weak topics identified yet.</p>
              <p className="text-sm opacity-80 mt-1">Keep logging activities to get recommendations!</p>
            </div>
          )}
        </div>

        <div className="glass-card rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          <h3 className="font-semibold text-lg text-emerald-600 dark:text-emerald-500 mb-6 flex items-center gap-2">
            <Award size={20} />
            Strong Topics
          </h3>
          {recommendations.strongTopics?.length > 0 ? (
            <ul className="space-y-3 z-10 relative">
              {recommendations.strongTopics.slice(0, 5).map((s) => (
                <li key={s.topicId} className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                  <span className="font-medium text-slate-800 dark:text-slate-200">{s.topic?.name || 'Unknown Topic'}</span>
                  <div className="flex gap-3 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    <span className="flex items-center gap-1 bg-white dark:bg-dark-bg px-2 py-1 rounded-md shadow-sm border border-emerald-50 dark:border-emerald-900/40">
                      Conf: {s.avgConfidence?.toFixed(1)}/5
                    </span>
                    <span className="flex items-center gap-1 bg-white dark:bg-dark-bg px-2 py-1 rounded-md shadow-sm border border-emerald-50 dark:border-emerald-900/40">
                      Score: {s.avgScore?.toFixed(0) || '-'}%
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center text-emerald-700 dark:text-emerald-500/70 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-dashed border-emerald-200 dark:border-emerald-900/30">
              <p className="font-medium">No strong topics identified yet.</p>
              <p className="text-sm opacity-80 mt-1">Keep learning and logging your progress!</p>
            </div>
          )}
        </div>
      </div>

      {confidenceTrends.length > 0 && (
        <div className="glass-card rounded-2xl p-6 lg:p-8">
          <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
            <Activity size={20} className="text-primary-500" />
            Long-term Confidence Evolution (by Topic)
          </h3>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={confidenceTrends} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700/50" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'currentColor' }} className="text-slate-500 dark:text-slate-400" />
                <YAxis domain={[0, 5]} tick={{ fontSize: 12, fill: 'currentColor' }} className="text-slate-500 dark:text-slate-400" tickCount={6} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', background: 'var(--tw-prose-invert, #fff)' }}
                  itemStyle={{ fontWeight: 600 }}
                />
                <Line type="monotone" dataKey="level" name="Level" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, fill: '#6366f1' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
