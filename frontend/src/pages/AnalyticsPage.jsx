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
      <div>
        <h1 className="font-display font-bold text-2xl mb-6">Analytics</h1>
        <CardSkeleton />
      </div>
    );
  }

  const weeklyConfData =
    weekly?.confidenceLogs?.reduce((acc, c) => {
      const d = new Date(c.date).toLocaleDateString();
      const i = acc.findIndex((x) => x.date === d);
      if (i >= 0) {
        acc[i].total += c.confidenceLevel;
        acc[i].count++;
      } else acc.push({ date: d, total: c.confidenceLevel, count: 1 });
      return acc;
    }, [])?.map((x) => ({ ...x, avg: (x.total / x.count).toFixed(1) })) || [];

  const topicStats = monthly?.topicStats || [];

  return (
    <div>
      <h1 className="font-display font-bold text-2xl mb-2">Analytics Dashboard</h1>
      <p className="text-slate-500 mb-6">
        Confidence vs performance, progress trends, weak & strong topics
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold mb-4">Weekly Confidence Trend</h3>
          {weeklyConfData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={weeklyConfData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="avg" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 py-12 text-center">No confidence data for this week</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold mb-4">Topic Performance</h3>
          {topicStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topicStats} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 5]} />
                <YAxis type="category" dataKey="topic" width={70} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="avgConfidence" fill="#0ea5e9" name="Avg Confidence" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 py-12 text-center">No topic data yet</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
          <h3 className="font-semibold text-amber-800 mb-3">Weak Topics (Need Revision)</h3>
          {recommendations.weakTopics?.length > 0 ? (
            <ul className="space-y-2">
              {recommendations.weakTopics.slice(0, 5).map((w) => (
                <li key={w.topicId} className="flex justify-between text-sm">
                  <span>{w.topic?.name}</span>
                  <span className="text-amber-700">
                    Conf: {w.avgConfidence?.toFixed(1)} | Score: {w.avgScore?.toFixed(0) || '-'}%
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-amber-700">No weak topics identified yet. Keep logging!</p>
          )}
        </div>

        <div className="bg-green-50 rounded-xl border border-green-200 p-6">
          <h3 className="font-semibold text-green-800 mb-3">Strong Topics</h3>
          {recommendations.strongTopics?.length > 0 ? (
            <ul className="space-y-2">
              {recommendations.strongTopics.slice(0, 5).map((s) => (
                <li key={s.topicId} className="flex justify-between text-sm">
                  <span>{s.topic?.name}</span>
                  <span className="text-green-700">
                    Conf: {s.avgConfidence?.toFixed(1)} | Score: {s.avgScore?.toFixed(0) || '-'}%
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-green-700">No strong topics yet.</p>
          )}
        </div>
      </div>

      {confidenceTrends.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold mb-4">Confidence Evolution (by Topic)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={confidenceTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="level" stroke="#0ea5e9" strokeWidth={1.5} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
