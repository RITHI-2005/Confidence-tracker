import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ConfidencePage from './pages/ConfidencePage';
import ActivityPage from './pages/ActivityPage';
import GoalsPage from './pages/GoalsPage';
import ReflectionPage from './pages/ReflectionPage';
import AnalyticsPage from './pages/AnalyticsPage';
import TeacherPage from './pages/TeacherPage';
import ReportsPage from './pages/ReportsPage';
import AdminPage from './pages/AdminPage';
import StudentMockTestsPage from './pages/StudentMockTestsPage';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary-300 animate-bounce" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/" /> : <Signup />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/confidence" element={<ProtectedRoute roles={['student']}><ConfidencePage /></ProtectedRoute>} />
                <Route path="/activity" element={<ProtectedRoute roles={['student']}><ActivityPage /></ProtectedRoute>} />
                <Route path="/goals" element={<ProtectedRoute roles={['student']}><GoalsPage /></ProtectedRoute>} />
                <Route path="/reflection" element={<ProtectedRoute roles={['student']}><ReflectionPage /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute roles={['student']}><AnalyticsPage /></ProtectedRoute>} />
                <Route path="/mock-tests" element={<ProtectedRoute roles={['student']}><StudentMockTestsPage /></ProtectedRoute>} />
                <Route path="/teacher" element={<ProtectedRoute roles={['teacher', 'admin']}><TeacherPage /></ProtectedRoute>} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminPage /></ProtectedRoute>} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
