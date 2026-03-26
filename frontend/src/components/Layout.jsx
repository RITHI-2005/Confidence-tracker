import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Activity, Target, BookOpen, LineChart, 
  FileText, Users, Shield, LogOut, Menu, Moon, Sun, X
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['student', 'teacher', 'admin'] },
  { to: '/confidence', label: 'Confidence', icon: HeartPulseIcon, roles: ['student'] },
  { to: '/activity', label: 'Activities', icon: Activity, roles: ['student'] },
  { to: '/goals', label: 'Goals', icon: Target, roles: ['student'] },
  { to: '/reflection', label: 'Reflection', icon: BookOpen, roles: ['student'] },
  { to: '/analytics', label: 'Analytics', icon: LineChart, roles: ['student'] },
  { to: '/mock-tests', label: 'Mock Tests', icon: FileText, roles: ['student'] },
  { to: '/teacher', label: 'Teacher', icon: Users, roles: ['teacher', 'admin'] },
  { to: '/reports', label: 'Reports', icon: FileText, roles: ['student', 'teacher', 'admin'] },
  { to: '/admin', label: 'Admin Panel', icon: Shield, roles: ['admin'] }
];

// Helper icon since HeartPulse isn't always stable in some lucide versions, use Activity as fallback
function HeartPulseIcon(props) {
  return <Activity {...props} />;
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const items = navItems.filter((i) => i.roles.includes(user?.role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-dark-bg transition-colors duration-300">
      <header className="glass sticky top-0 z-40 border-b border-slate-200/50 dark:border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-border transition-colors text-slate-600 dark:text-dark-muted"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <Link to="/" className="font-display font-bold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400 dark:from-primary-400 dark:to-primary-200 tracking-tight">
                Confidence Tracker
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-dark-muted dark:hover:bg-dark-card transition-all"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun size={20} className="animate-fade-in" /> : <Moon size={20} className="animate-fade-in" />}
              </button>
              
              <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-dark-border">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{user?.name}</span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 capitalize border border-primary-200/50 dark:border-primary-800/50 shadow-sm">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <nav className="lg:hidden absolute top-16 left-0 right-0 glass border-b border-slate-200 dark:border-dark-border px-4 py-4 flex flex-col gap-2 animate-slide-up shadow-xl">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                    isActive 
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400' 
                      : 'text-slate-600 hover:bg-slate-100 dark:text-dark-muted dark:hover:bg-dark-card dark:hover:text-slate-200'
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon size={20} className={isActive ? "text-primary-600 dark:text-primary-400" : ""} />
                  {item.label}
                </Link>
              );
            })}
            <div className="h-px bg-slate-200 dark:bg-dark-border my-2" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20 transition-all text-left"
            >
              <LogOut size={20} />
              Logout
            </button>
          </nav>
        )}
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        <aside className="hidden lg:flex w-64 flex-col glass-card my-6 ml-6 rounded-2xl border border-white/50 dark:border-dark-border shadow-sm min-h-[calc(100vh-8rem)] sticky top-24 overflow-hidden">
          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
              
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400 shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:bg-dark-card dark:hover:text-slate-200'
                  }`}
                >
                  <Icon 
                    size={20} 
                    className={`transition-colors duration-200 ${
                      isActive 
                        ? 'text-primary-600 dark:text-primary-400' 
                        : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'
                    }`} 
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          
          <div className="p-4 border-t border-slate-200/50 dark:border-dark-border bg-slate-50/50 dark:bg-dark-card/30">
            <button
              onClick={handleLogout}
              className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-900/20 dark:hover:text-rose-400 transition-all duration-200"
            >
              <LogOut size={20} className="text-slate-400 group-hover:text-rose-500 dark:text-slate-500 dark:group-hover:text-rose-400 transition-colors" />
              Logout
            </button>
          </div>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full">
          <div className="animate-fade-in w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
