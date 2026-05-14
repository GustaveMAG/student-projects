import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';

import LoginPage        from './pages/LoginPage';
import RegisterPage     from './pages/RegisterPage';
import DashboardPage    from './pages/DashboardPage';
import ProjectsPage     from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ProjectFormPage  from './pages/ProjectFormPage';
import TaskFormPage     from './pages/TaskFormPage';
import TaskDetailPage   from './pages/TaskDetailPage';

// ── Guards ────────────────────────────────────────────────────────────────────
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center text-primary-muted bg-base text-sm">Chargement…</div>;
  return user ? children : <Navigate to="/login" replace />;
}

function RequireRole({ role, children }) {
  const { user } = useAuth();
  return user?.role === role ? children : <Navigate to="/projects" replace />;
}

function RedirectHome() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user)   return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'encadrant' ? '/dashboard' : '/projects'} replace />;
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1A1A1A',
              color: '#F5F5F5',
              border: '1px solid #2A2A2A',
              fontSize: '13px',
            },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protégé */}
          <Route
            path="/*"
            element={
              <RequireAuth>
                <Layout>
                  <Routes>
                    <Route path="/" element={<RedirectHome />} />

                    {/* Tableau de bord — encadrant uniquement */}
                    <Route
                      path="/dashboard"
                      element={
                        <RequireRole role="encadrant">
                          <DashboardPage />
                        </RequireRole>
                      }
                    />

                    {/* Projets */}
                    <Route path="/projects"          element={<ProjectsPage />} />
                    <Route path="/projects/new"      element={<RequireRole role="encadrant"><ProjectFormPage /></RequireRole>} />
                    <Route path="/projects/:id"      element={<ProjectDetailPage />} />
                    <Route path="/projects/:id/edit" element={<RequireRole role="encadrant"><ProjectFormPage /></RequireRole>} />

                    {/* Tâches */}
                    <Route path="/projects/:projectId/tasks/new"       element={<TaskFormPage />} />
                    <Route path="/projects/:projectId/tasks/:id"       element={<TaskDetailPage />} />
                    <Route path="/projects/:projectId/tasks/:id/edit"  element={<TaskFormPage />} />

                    {/* 404 */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </RequireAuth>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
