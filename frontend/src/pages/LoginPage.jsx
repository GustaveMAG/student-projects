import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

/* ── Geometric art panel ── */
function ArtPanel() {
  return (
    <div
      className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col"
      style={{ background: 'linear-gradient(135deg, #3D1A6E 0%, #0D0D1A 100%)' }}
    >
      {/* Animated background orbs */}
      <div
        className="absolute -top-32 -left-32 w-80 h-80 rounded-full animate-pulse-slow"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.4) 0%, transparent 70%)', filter: 'blur(40px)' }}
      />
      <div
        className="absolute bottom-0 right-0 w-96 h-96 rounded-full animate-pulse-slow"
        style={{ background: 'radial-gradient(circle, rgba(255,107,53,0.25) 0%, transparent 70%)', filter: 'blur(50px)', animationDelay: '2s' }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full animate-pulse-slow"
        style={{ background: 'radial-gradient(circle, rgba(61,26,110,0.5) 0%, transparent 70%)', filter: 'blur(30px)', animationDelay: '1s' }}
      />

      {/* Dot grid */}
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.06 }}>
        <defs>
          <pattern id="art-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="#9990BB" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#art-dots)" />
      </svg>

      {/* Diagonal lines top-right */}
      <svg className="absolute top-0 right-0 opacity-[0.08]" width="220" height="220" viewBox="0 0 220 220" fill="none">
        {[0, 22, 44, 66, 88, 110, 132, 154, 176, 198].map(o => (
          <line key={o} x1={o} y1="0" x2="220" y2={220 - o} stroke="#FF6B35" strokeWidth="1" />
        ))}
      </svg>

      {/* Large hexagon */}
      <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-float opacity-[0.12]"
        width="340" height="390" viewBox="0 0 340 390" fill="none">
        <path d="M170 10L330 95V275L170 360L10 275V95L170 10Z" stroke="#7C3AED" strokeWidth="1.5" fill="none" />
        <path d="M170 40L300 112V255L170 327L40 255V112L170 40Z" stroke="#FF6B35" strokeWidth="1" fill="none" />
        <path d="M170 80L260 130V230L170 280L80 230V130L170 80Z" stroke="#7C3AED" strokeWidth="0.5" fill="rgba(124,58,237,0.04)" />
      </svg>

      {/* Floating triangle */}
      <svg className="absolute bottom-32 left-12 animate-float opacity-[0.15]" width="80" height="70"
        viewBox="0 0 80 70" fill="none" style={{ animationDelay: '2s' }}>
        <polygon points="40,4 76,66 4,66" stroke="#FF6B35" strokeWidth="1.5" fill="none" />
      </svg>

      {/* Small circles cluster */}
      <svg className="absolute top-20 right-20 animate-float opacity-[0.15]" width="70" height="70"
        viewBox="0 0 70 70" fill="none" style={{ animationDelay: '3s' }}>
        <circle cx="20" cy="20" r="14" stroke="#7C3AED" strokeWidth="1.5" fill="none" />
        <circle cx="50" cy="50" r="10" stroke="#FF6B35" strokeWidth="1.5" fill="none" />
        <circle cx="52" cy="18" r="6" stroke="#7C3AED" strokeWidth="1" fill="none" />
      </svg>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-12">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #FF6B35)' }}>
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-white text-lg font-bold tracking-tight">ProjetsÉtudiants</span>
        </div>

        {/* Hero text */}
        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Gérez vos projets<br />
            <span style={{ background: 'linear-gradient(135deg, #7C3AED, #FF6B35)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              brillamment.
            </span>
          </h1>
          <p className="text-[#9990BB] text-base leading-relaxed max-w-xs">
            Suivez l'avancement, collaborez en équipe et livrez dans les délais avec une plateforme conçue pour l'excellence.
          </p>

          {/* Feature bullets */}
          <div className="mt-8 space-y-4">
            {[
              { icon: '⚡', text: 'Tableau de bord avec indicateurs en temps réel' },
              { icon: '🎯', text: 'Suivi des tâches par statut et deadline' },
              { icon: '📁', text: 'Dépôt de livrables centralisé' },
              { icon: '💬', text: 'Commentaires par tâche pour collaborer' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-base">{icon}</span>
                <span className="text-sm text-[#9990BB]">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span className="text-white text-xs font-bold">J</span>
          </div>
          <span className="text-[#6B648A] text-sm">JUNIA — Grande École d'Ingénieurs</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Bienvenue, ${user.nom} !`);
      navigate(user.role === 'encadrant' ? '/dashboard' : '/projects');
    } catch (err) {
      setError(err.response?.data?.message || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-base">
      <ArtPanel />

      {/* ── Right: Form ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 relative overflow-hidden">
        {/* Subtle background glow */}
        <div
          className="absolute -top-20 right-0 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }}
        />

        <div className="w-full max-w-sm relative z-10">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #FF6B35)' }}>
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-base font-bold text-ink">ProjetsÉtudiants</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-ink">Connexion</h2>
            <p className="text-ink-muted text-sm mt-1">Accédez à votre espace JUNIA</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-center gap-2 text-sm text-danger bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="vous@junia.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required autoFocus autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label className="label">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-faint hover:text-ink transition-colors"
                >
                  {showPwd ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center py-3 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-sm text-ink-muted mt-6">
            Pas de compte ?{' '}
            <Link to="/register" className="font-semibold hover:text-ink transition-colors"
              style={{ color: '#7C3AED' }}>
              Créer un compte
            </Link>
          </p>

          {/* Demo hint */}
          <div className="mt-6 p-3 rounded-xl border border-border bg-surface-2">
            <p className="text-[11px] text-ink-faint text-center mb-2 font-medium uppercase tracking-wide">Comptes de démonstration</p>
            <div className="space-y-1 text-[11px] text-ink-muted">
              <p>Encadrant : <span className="text-ink">supervisor@junia.com</span></p>
              <p>Étudiant : <span className="text-ink">student@junia.com</span></p>
              <p className="text-ink-faint">Mot de passe : <span className="text-ink">utilisez celui que vous avez créé</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
