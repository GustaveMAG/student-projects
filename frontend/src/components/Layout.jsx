import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const navLinks = {
  encadrant: [
    { to: '/dashboard', label: 'Tableau de bord' },
    { to: '/projects',  label: 'Projets' },
  ],
  etudiant: [
    { to: '/projects', label: 'Mes projets' },
  ],
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };
  const links = navLinks[user?.role] || [];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-lg font-bold text-primary-700">
              ProjetsÉtudiants
            </Link>
            <nav className="hidden sm:flex gap-4">
              {links.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`text-sm font-medium transition-colors ${
                    location.pathname.startsWith(to)
                      ? 'text-primary-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{user?.nom}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              user?.role === 'encadrant'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-accent-100 text-accent-600'
            }`}>
              {user?.role}
            </span>
            <button onClick={handleLogout} className="btn-secondary text-xs px-3 py-1.5">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
