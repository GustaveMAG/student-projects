import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NAV = {
  encadrant: [
    { to: '/dashboard', label: 'Dashboard',  Icon: IconHome },
    { to: '/projects',  label: 'Projets',    Icon: IconFolder },
  ],
  etudiant: [
    { to: '/projects', label: 'Mes projets', Icon: IconFolder },
  ],
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const links     = NAV[user?.role] || [];
  const initial   = user?.nom?.charAt(0).toUpperCase() || '?';

  return (
    <div className="min-h-screen flex bg-base text-primary">

      {/* ── Sidebar ── */}
      <aside className="w-[240px] min-h-screen flex flex-col border-r border-border flex-shrink-0 bg-base">

        {/* App name */}
        <div className="h-14 flex items-center px-4 border-b border-border gap-2.5">
          <div className="w-6 h-6 bg-accent rounded-md flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-primary tracking-tight">ProjetsÉtudiants</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          <p className="label px-3 pt-1 pb-2">Navigation</p>

          {links.map(({ to, label, Icon }) => {
            const active = location.pathname === to ||
              (to !== '/dashboard' && location.pathname.startsWith(to));
            return (
              <Link key={to} to={to} className={active ? 'nav-item-active' : 'nav-item'}>
                <Icon />
                <span>{label}</span>
              </Link>
            );
          })}

          {user?.role === 'encadrant' && (
            <>
              <div className="pt-3 pb-1">
                <p className="label px-3">Actions</p>
              </div>
              <Link to="/projects/new" className="nav-item">
                <IconPlus />
                <span>Nouveau projet</span>
              </Link>
            </>
          )}
        </nav>

        {/* User + logout */}
        <div className="px-2 py-3 border-t border-border">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-surface-2 transition-colors group">
            <div className="w-6 h-6 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-[11px] font-semibold text-accent flex-shrink-0">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-primary truncate leading-tight">{user?.nom}</p>
              <p className="text-[11px] text-primary-muted capitalize">{user?.role}</p>
            </div>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              title="Déconnexion"
              className="opacity-0 group-hover:opacity-100 text-primary-muted hover:text-danger transition-all"
            >
              <IconLogout />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {children}
      </div>
    </div>
  );
}

/* ── Icons (16×16 SVG) ── */
function IconHome() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}
function IconFolder() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}
