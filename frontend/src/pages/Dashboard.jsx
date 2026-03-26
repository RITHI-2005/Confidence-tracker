import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { CardSkeleton } from '../components/Skeleton';
import { 
  Users, UserCheck, Shield, BarChart3, TrendingUp, BookOpen, 
  CheckCircle, Target, Activity, Settings, Bell, Clock 
} from 'lucide-react';

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
      <div className="w-full">
        <h1 className="font-display font-bold text-3xl mb-8 text-slate-800 dark:text-white">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
    <div className="w-full max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl mb-2 text-slate-900 dark:text-white">
          Welcome back, {user?.name}
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          {isAdmin ? 'System control panel overview' : 'Here\'s your learning overview for today.'}
        </p>
      </div>

      {!isAdmin && notifications.length > 0 && (
        <div className="mb-8 p-5 rounded-2xl glass-card bg-amber-50/80 border-amber-200/50 dark:bg-amber-900/10 dark:border-amber-700/30">
          <div className="flex items-center gap-3 mb-3 text-amber-800 dark:text-amber-500">
            <Bell size={20} />
            <h3 className="font-semibold text-lg">Notifications</h3>
          </div>
          <ul className="space-y-2">
            {notifications.slice(0, 3).map((n) => (
              <li key={n._id} className="text-sm font-medium text-amber-700/80 dark:text-amber-200/70 flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span><span className="font-semibold">{n.title}:</span> {n.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isAdmin ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Users" value={stats?.totalUsers ?? 0} icon={Users} color="text-blue-500" />
          <StatCard title="Total Students" value={stats?.totalStudents ?? 0} icon={UserCheck} color="text-green-500" />
          <StatCard title="Total Teachers" value={stats?.totalTeachers ?? 0} icon={BookOpen} color="text-purple-500" />
          <StatCard title="Total Skills" value={stats?.totalSkills ?? 0} icon={Activity} color="text-rose-500" />
          <StatCard title="Avg Confidence" value={stats?.avgConfidence ?? '-'} icon={TrendingUp} color="text-amber-500" />
          <StatCard title="Active (7d)" value={stats?.activeUsers ?? 0} icon={Clock} color="text-teal-500" />
          
          <Link
            to="/admin"
            className="group block p-6 rounded-2xl glass-card bg-slate-900 text-white border-slate-700 dark:bg-primary-900/50 dark:border-primary-800/50 hover:scale-[1.02] transition-all duration-300 col-span-full lg:col-span-2 overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-500">
              <Shield size={100} />
            </div>
            <h3 className="font-bold text-xl mb-1 flex items-center gap-2">
              <Settings className="group-hover:rotate-90 transition-transform duration-500" /> 
              Admin Control Panel
            </h3>
            <p className="text-slate-400 text-sm mt-1">Manage users, activities, and global skills</p>
          </Link>
          
          <Link
            to="/teacher"
            className="group block p-6 rounded-2xl glass-card hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                <Users size={24} />
              </div>
              <h3 className="font-semibold text-lg text-slate-800 dark:text-white">Teacher View</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Monitor students & skills</p>
          </Link>
        </div>
      ) : isTeacher ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Students" value={stats?.students ?? 0} icon={Users} color="text-blue-500" />
          <StatCard title="Struggling" value={stats?.struggling ?? 0} icon={Activity} color="text-rose-500" />
          
          <Link
            to="/teacher"
            className="group block p-6 rounded-2xl glass-card hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                <UserCheck size={24} />
              </div>
              <h3 className="font-semibold text-lg text-slate-800 dark:text-white">View Students</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Monitor class progress</p>
          </Link>
          
          <Link
            to="/reports"
            className="group block p-6 rounded-2xl glass-card hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <BarChart3 size={24} />
              </div>
              <h3 className="font-semibold text-lg text-slate-800 dark:text-white">Reports</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Generate analytics reports</p>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Avg Confidence (Weekly)" value={stats?.avgConfidence ?? '-'} icon={TrendingUp} color="text-primary-500" />
          <StatCard title="Study Hours (Weekly)" value={stats?.studyHours ?? 0} icon={Clock} color="text-emerald-500" />
          <StatCard title="Learning Streak" value={`${stats?.streak ?? 0} days`} icon={Activity} color="text-amber-500" />
          <StatCard
            title="Goals Completed"
            value={`${stats?.goalsCompleted ?? 0}/${stats?.goalsTotal ?? 0}`}
            icon={Target}
            color="text-purple-500"
          />
        </div>
      )}

      {!isTeacher && !isAdmin && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/confidence"
            className="group relative overflow-hidden p-8 rounded-2xl glass-card border border-primary-200 dark:border-primary-800/30 bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/20 dark:to-dark-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-125 transition-transform duration-500">
              <TrendingUp size={120} />
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-primary-100 dark:bg-primary-900/50 rounded-xl text-primary-600 dark:text-primary-400">
                <TrendingUp size={28} />
              </div>
              <h3 className="font-bold text-xl text-primary-900 dark:text-primary-100">Log Confidence</h3>
            </div>
            <p className="text-primary-600/80 dark:text-primary-300/70 font-medium">Rate your confidence securely after learning a topic to track improvements over time.</p>
          </Link>
          
          <Link
            to="/activity"
            className="group relative overflow-hidden p-8 rounded-2xl glass-card border border-emerald-200 dark:border-emerald-800/30 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-dark-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-125 transition-transform duration-500">
              <CheckCircle size={120} />
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl text-emerald-600 dark:text-emerald-400">
                <CheckCircle size={28} />
              </div>
              <h3 className="font-bold text-xl text-emerald-900 dark:text-emerald-100">Add Activity</h3>
            </div>
            <p className="text-emerald-600/80 dark:text-emerald-300/70 font-medium">Log study hours, record quizzes, and track assignments to visualize your efforts.</p>
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="group p-6 rounded-2xl glass-card relative overflow-hidden hover:-translate-y-1 transition-transform duration-300 shadow-sm">
      <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform duration-500 ${color}`}>
        {Icon && <Icon size={80} />}
      </div>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</h3>
          <p className="text-3xl font-display font-bold text-slate-900 dark:text-white mt-2 tracking-tight">{value}</p>
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl bg-slate-50 dark:bg-dark-bg ${color}`}>
            <Icon size={24} />
          </div>
        )}
      </div>
    </div>
  );
}
