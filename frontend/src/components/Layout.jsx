import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/* ─────────────────────────────────────────────
   Icon set (Lucide-style inline SVGs)
───────────────────────────────────────────── */
function IcoDashboard() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}
function IcoFolder() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}
function IcoPlus() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" />
    </svg>
  );
}
function IcoLogout() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}
function IcoLayers() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}

const NAV = {
  encadrant: [
    { to: '/dashboard', label: 'Dashboard',   Icon: IcoDashboard },
    { to: '/projects',  label: 'Projets',     Icon: IcoFolder },
  ],
  etudiant: [
    { to: '/projects', label: 'Mes projets', Icon: IcoFolder },
  ],
};

/* ─────────────────────────────────────────────
   Global background decoration
───────────────────────────────────────────── */
function BackgroundDecor() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Large violet orb — top left */}
      <div
        className="absolute -top-48 -left-48 w-[600px] h-[600px] rounded-full animate-pulse-slow"
        style={{
          background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      {/* Orange orb — right */}
      <div
        className="absolute top-1/4 -right-32 w-[400px] h-[400px] rounded-full animate-pulse-slow"
        style={{
          background: 'radial-gradient(circle, rgba(255,107,53,0.12) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animationDelay: '2s',
        }}
      />
      {/* Deep violet orb — bottom */}
      <div
        className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] rounded-full animate-pulse-slow"
        style={{
          background: 'radial-gradient(circle, rgba(61,26,110,0.20) 0%, transparent 70%)',
          filter: 'blur(50px)',
          animationDelay: '4s',
        }}
      />

      {/* Dot grid overlay */}
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.025 }}>
        <defs>
          <pattern id="bg-dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1.5" fill="#9990BB" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#bg-dots)" />
      </svg>

      {/* Floating hexagon — top right */}
      <svg
        className="absolute top-16 right-24 animate-float opacity-[0.06]"
        width="120" height="140" viewBox="0 0 120 140" fill="none"
        style={{ animationDelay: '1s' }}
      >
        <path
          d="M60 4L112 32V88L60 116L8 88V32L60 4Z"
          stroke="#7C3AED" strokeWidth="2" fill="none"
        />
        <path
          d="M60 20L96 40V80L60 100L24 80V40L60 20Z"
          stroke="#FF6B35" strokeWidth="1" fill="none" opacity="0.5"
        />
      </svg>

      {/* Floating triangle — bottom left */}
      <svg
        className="absolute bottom-24 left-16 animate-float opacity-[0.05]"
        width="100" height="100" viewBox="0 0 100 100" fill="none"
        style={{ animationDelay: '3s' }}
      >
        <polygon points="50,5 95,87 5,87" stroke="#FF6B35" strokeWidth="1.5" fill="none" />
        <polygon points="50,20 80,75 20,75" stroke="#7C3AED" strokeWidth="1" fill="none" opacity="0.5" />
      </svg>

      {/* Diagonal lines — bottom right corner */}
      <svg
        className="absolute bottom-0 right-0 opacity-[0.04]"
        width="200" height="200" viewBox="0 0 200 200" fill="none"
      >
        {[0, 20, 40, 60, 80, 100, 120, 140, 160, 180].map((offset) => (
          <line key={offset}
            x1={offset} y1="200"
            x2="200" y2={offset}
            stroke="#7C3AED" strokeWidth="1"
          />
        ))}
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Sidebar dot pattern
───────────────────────────────────────────── */
function SidebarPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.03 }}>
      <defs>
        <pattern id="sidebar-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.2" fill="#7C3AED" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#sidebar-dots)" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Main Layout
───────────────────────────────────────────── */
export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const links     = NAV[user?.role] || [];
  const initial   = user?.nom?.charAt(0).toUpperCase() || '?';

  return (
    <div className="min-h-screen flex bg-base text-ink">
      <BackgroundDecor />

      {/* ── Sidebar ── */}
      <aside
        className="relative w-[240px] min-h-screen flex flex-col flex-shrink-0 z-10 overflow-hidden"
        style={{ background: '#16162A', borderRight: '1px solid #2D2D4A' }}
      >
        <SidebarPattern />

        {/* Corner glow */}
        <div
          className="absolute -top-20 -right-20 w-48 h-48 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
        />

        {/* ── Logo ── */}
        <div className="relative z-10 h-16 flex items-center px-5 border-b border-border flex-shrink-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 shadow-glow-sm"
            style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #FF6B35 100%)' }}
          >
            <IcoLayers />
          </div>
          <span className="text-sm font-bold text-ink tracking-tight">ProjetsÉtudiants</span>
        </div>

        {/* ── Navigation ── */}
        <nav className="relative z-10 flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="section-title px-3 pb-3 pt-1">Navigation</p>

          {links.map(({ to, label, Icon }) => {
            const active = location.pathname === to ||
              (to !== '/dashboard' && location.pathname.startsWith(to));

            return (
              <Link key={to} to={to} className={active ? 'nav-item-active' : 'nav-item'}>
                {/* Active indicator bar */}
                {active && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full"
                    style={{ background: 'linear-gradient(180deg, #7C3AED, #FF6B35)' }}
                  />
                )}
                <Icon />
                <span>{label}</span>
              </Link>
            );
          })}

          {user?.role === 'encadrant' && (
            <>
              <div className="pt-4 pb-1">
                <p className="section-title px-3 pb-3">Actions</p>
              </div>
              <Link to="/projects/new" className="nav-item">
                <IcoPlus />
                <span>Nouveau projet</span>
              </Link>
            </>
          )}
        </nav>

        {/* ── User zone ── */}
        <div className="relative z-10 px-3 py-4 border-t border-border flex-shrink-0">
          {/* Subtle orange glow at bottom */}
          <div
            className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-32 h-20 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(255,107,53,0.12) 0%, transparent 70%)',
              filter: 'blur(15px)',
            }}
          />
          <div className="relative flex items-center gap-3 px-3 py-2.5 rounded-lg group hover:bg-white/5 transition-all duration-200 cursor-pointer">
            {/* Avatar with gradient ring */}
            <div className="relative flex-shrink-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #FF6B35)' }}
              >
                {initial}
              </div>
              <div
                className="absolute -inset-0.5 rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #FF6B35)' }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-ink truncate leading-tight">{user?.nom}</p>
              <p className="text-[11px] text-ink-faint capitalize">{user?.role}</p>
            </div>

            <button
              onClick={() => { logout(); navigate('/login'); }}
              title="Déconnexion"
              className="opacity-0 group-hover:opacity-100 text-ink-faint hover:text-danger transition-all duration-200"
            >
              <IcoLogout />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="relative z-10 flex-1 flex flex-col min-h-screen overflow-hidden">
        {children}
      </div>
    </div>
  );
}
