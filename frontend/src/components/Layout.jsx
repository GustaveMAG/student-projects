import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NAV = {
  encadrant: [
    { to: '/dashboard', label: 'Tableau de bord', icon: IconDashboard },
    { to: '/projects',  label: 'Projets',         icon: IconProjects },
  ],
  etudiant: [
    { to: '/projects', label: 'Mes projets', icon: IconProjects },
  ],
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };
  const links = NAV[user?.role] || [];
  const initial = user?.nom?.charAt(0).toUpperCase() || '?';

  return (
    <div className="min-h-screen flex">

      {/* ── Sidebar ── */}
      <aside className="w-60 min-h-screen bg-primary-800 flex flex-col flex-shrink-0 shadow-xl">

        {/* Brand */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-accent-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-white font-bold text-[15px] tracking-tight">ProjetsÉtudiants</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-0.5">
          <p className="text-[10px] font-semibold text-white/35 uppercase tracking-widest px-3 pb-2">
            {user?.role === 'encadrant' ? 'Gestion' : 'Navigation'}
          </p>

          {links.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-white/60 hover:bg-white/8 hover:text-white/90'
                }`}
              >
                <Icon active={active} />
                {label}
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-500" />
                )}
              </Link>
            );
          })}

          {user?.role === 'encadrant' && (
            <>
              <div className="pt-4 pb-2">
                <p className="text-[10px] font-semibold text-white/35 uppercase tracking-widest px-3">Actions</p>
              </div>
              <Link
                to="/projects/new"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-white/8 hover:text-white/90 transition-all"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nouveau projet
              </Link>
            </>
          )}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-500 to-accent-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[13px] font-semibold truncate leading-tight">{user?.nom}</p>
              <p className="text-white/45 text-[11px] capitalize">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Déconnexion"
              className="text-white/35 hover:text-white/80 transition-colors flex-shrink-0 p-1 rounded-lg hover:bg-white/10"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Content area ── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden bg-gray-50">
        {children}
      </div>
    </div>
  );
}

/* ── Nav icons ── */
function IconDashboard({ active }) {
  return (
    <svg className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-white/50'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}
function IconProjects({ active }) {
  return (
    <svg className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-white/50'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}
