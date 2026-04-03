import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', roles: ['student', 'teacher', 'admin'] },
  { to: '/confidence', label: 'Confidence', roles: ['student'] },
  { to: '/activity', label: 'Activities', roles: ['student'] },
  { to: '/goals', label: 'Goals', roles: ['student'] },
  { to: '/reflection', label: 'Reflection', roles: ['student'] },
  { to: '/analytics', label: 'Analytics', roles: ['student'] },
  { to: '/mock-tests', label: 'Mock Tests', roles: ['student'] },
  { to: '/teacher', label: 'Teacher', roles: ['teacher', 'admin'] },
  { to: '/reports', label: 'Reports', roles: ['student', 'teacher', 'admin'] },
  { to: '/admin', label: 'Admin Panel', roles: ['admin'] }
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const items = navItems.filter((i) => i.roles.includes(user?.role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Link to="/" className="font-display font-bold text-xl text-primary-600">
                Confidence Tracker
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600 hidden sm:inline">{user?.name}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700 capitalize">
                {user?.role}
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <nav className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 flex flex-col gap-1">
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="px-3 py-2 rounded-lg hover:bg-slate-100 font-medium"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <div className="flex flex-1">
        <aside className="hidden lg:block w-56 border-r border-slate-200 bg-white min-h-[calc(100vh-56px)]">
          <nav className="p-4 space-y-1 sticky top-14">
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="block px-3 py-2 rounded-lg hover:bg-slate-100 font-medium text-slate-700 hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}
