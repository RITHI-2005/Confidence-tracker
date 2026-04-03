import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { CardSkeleton } from '../components/Skeleton';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user?.role === 'admin') {
      api.get('/api/admin/dashboard').then(({ data }) => {
        setStats(data);
        setLoading(false);
      }).catch(() => setLoading(false));
    } else if (user?.role === 'teacher') {
      api.get('/api/teacher/students').then(({ data }) => {
        setStats({
          students: data.length,
          struggling: data.filter((s) => s.struggling).length
        });
        setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      Promise.all([
        api.get(`/api/confidence/user/${user?.id}?period=weekly`),
        api.get(`/api/activity/user/${user?.id}?period=weekly`),
        api.get('/api/goals/user/' + user?.id),
        api.get('/api/notifications?limit=5')
      ])
        .then(([conf, act, goals, notif]) => {
          const confData = conf.data;
          const actData = act.data;
          const avgConf = confData.length
            ? (confData.reduce((a, c) => a + c.confidenceLevel, 0) / confData.length).toFixed(1)
            : '-';
          setStats({
            avgConfidence: avgConf,
            studyHours: actData.totalStudyHours || 0,
            streak: actData.streak || 0,
            goalsTotal: goals.data.length,
            goalsCompleted: goals.data.filter((g) => g.completed).length
          });
          setNotifications(notif.data.notifications || []);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (loading) {
    return (
      <div>
        <h1 className="font-display font-bold text-2xl mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';

  return (
    <div>
      <h1 className="font-display font-bold text-2xl mb-2">Welcome, {user?.name}</h1>
      <p className="text-slate-500 mb-6">
        {isAdmin ? 'System control panel overview' : 'Here\'s your learning overview'}
      </p>

      {!isAdmin && notifications.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <h3 className="font-semibold text-amber-800 mb-2">Notifications</h3>
          <ul className="space-y-1">
            {notifications.slice(0, 3).map((n) => (
              <li key={n._id} className="text-sm text-amber-700">
                {n.title}: {n.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {isAdmin ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Users" value={stats?.totalUsers ?? 0} />
          <StatCard title="Students" value={stats?.totalStudents ?? 0} />
          <StatCard title="Teachers" value={stats?.totalTeachers ?? 0} />
          <StatCard title="Skills" value={stats?.totalSkills ?? 0} />
          <StatCard title="Avg Confidence" value={stats?.avgConfidence ?? '-'} />
          <StatCard title="Active (7d)" value={stats?.activeUsers ?? 0} />
          <Link
            to="/admin"
            className="block p-6 rounded-xl bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 transition col-span-full lg:col-span-2"
          >
            <h3 className="font-semibold">Admin Control Panel</h3>
            <p className="text-slate-300 text-sm mt-1">Users, activities, skills</p>
          </Link>
          <Link
            to="/teacher"
            className="block p-6 rounded-xl bg-white border border-slate-200 hover:border-primary-300 hover:shadow-md transition"
          >
            <h3 className="font-semibold text-slate-800">Teacher View</h3>
            <p className="text-sm text-slate-500 mt-1">Students & skills</p>
          </Link>
        </div>
      ) : isTeacher ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Students" value={stats?.students ?? 0} />
          <StatCard title="Struggling" value={stats?.struggling ?? 0} />
          <Link
            to="/teacher"
            className="block p-6 rounded-xl bg-white border border-slate-200 hover:border-primary-300 hover:shadow-md transition"
          >
            <h3 className="font-semibold text-slate-800">View Students</h3>
            <p className="text-sm text-slate-500 mt-1">Monitor progress</p>
          </Link>
          <Link
            to="/reports"
            className="block p-6 rounded-xl bg-white border border-slate-200 hover:border-primary-300 hover:shadow-md transition"
          >
            <h3 className="font-semibold text-slate-800">Reports</h3>
            <p className="text-sm text-slate-500 mt-1">Generate reports</p>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Avg Confidence (Weekly)" value={stats?.avgConfidence ?? '-'} />
          <StatCard title="Study Hours (Weekly)" value={stats?.studyHours ?? 0} />
          <StatCard title="Learning Streak" value={`${stats?.streak ?? 0} days`} />
          <StatCard
            title="Goals"
            value={`${stats?.goalsCompleted ?? 0}/${stats?.goalsTotal ?? 0}`}
          />
        </div>
      )}

      {!isTeacher && !isAdmin && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/confidence"
            className="p-6 rounded-xl bg-primary-50 border border-primary-100 hover:border-primary-200 transition"
          >
            <h3 className="font-semibold text-primary-800">Log Confidence</h3>
            <p className="text-sm text-primary-600 mt-1">Rate your confidence after a topic</p>
          </Link>
          <Link
            to="/activity"
            className="p-6 rounded-xl bg-emerald-50 border border-emerald-100 hover:border-emerald-200 transition"
          >
            <h3 className="font-semibold text-emerald-800">Add Activity</h3>
            <p className="text-sm text-emerald-600 mt-1">Log study hours, quizzes, assignments</p>
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm">
      <h3 className="text-sm font-medium text-slate-500">{title}</h3>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
    </div>
  );
}
