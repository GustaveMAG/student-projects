import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const ROLES = [
  { value: 'etudiant',  label: 'Étudiant',  icon: '🎓', desc: 'Accédez à vos projets, gérez vos tâches' },
  { value: 'encadrant', label: 'Encadrant', icon: '👨‍🏫', desc: 'Supervisez projets et pilotez les équipes' },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [form, setForm]         = useState({ nom: '', email: '', password: '', role: 'etudiant' });
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({});

  const validate = () => {
    const e = {};
    if (!form.nom.trim())          e.nom      = 'Le nom est requis';
    if (!form.email.includes('@')) e.email    = 'Email invalide';
    if (form.password.length < 6)  e.password = 'Minimum 6 caractères';
    return e;
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    try {
      const user = await register(form);
      toast.success('Compte créé avec succès !');
      navigate(user.role === 'encadrant' ? '/dashboard' : '/projects');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  const field = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  };

  const pwdStrength = form.password.length >= 10 ? 3 : form.password.length >= 6 ? 2 : form.password.length > 0 ? 1 : 0;

  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full animate-pulse-slow pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)', filter: 'blur(50px)' }} />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full animate-pulse-slow pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,107,53,0.10) 0%, transparent 70%)', filter: 'blur(40px)', animationDelay: '2s' }} />

      {/* Dot grid */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.025 }}>
        <defs>
          <pattern id="reg-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="#9990BB" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#reg-dots)" />
      </svg>

      <div className="relative z-10 w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-glow-sm"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #FF6B35)' }}>
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-lg font-bold text-ink">ProjetsÉtudiants</span>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl p-7 shadow-card space-y-6">
          <div>
            <h1 className="text-xl font-bold text-ink">Créer un compte</h1>
            <p className="text-ink-muted text-sm mt-1">Rejoignez la plateforme JUNIA</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Role selector */}
            <div>
              <label className="label">Je suis…</label>
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map(({ value, label, icon, desc }) => {
                  const active = form.role === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => field('role', value)}
                      className="relative flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all duration-200 cursor-pointer overflow-hidden"
                      style={{
                        background: active ? 'rgba(124,58,237,0.10)' : '#1E1E35',
                        borderColor: active ? '#7C3AED' : '#2D2D4A',
                      }}
                    >
                      {active && (
                        <div className="absolute top-0 left-0 right-0 h-0.5"
                          style={{ background: 'linear-gradient(90deg, #7C3AED, #FF6B35)' }} />
                      )}
                      <span className="text-2xl">{icon}</span>
                      <span className="text-sm font-semibold" style={{ color: active ? '#F0EEFF' : '#9990BB' }}>{label}</span>
                      <span className="text-[10px] leading-tight" style={{ color: active ? '#9990BB' : '#6B648A' }}>{desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Nom */}
            <div>
              <label className="label">Nom complet</label>
              <input
                type="text"
                className={`input ${errors.nom ? 'border-danger/60' : ''}`}
                placeholder="Alice Martin"
                value={form.nom}
                onChange={(e) => field('nom', e.target.value)}
                autoFocus
              />
              {errors.nom && <p className="text-xs text-danger mt-1">{errors.nom}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className={`input ${errors.email ? 'border-danger/60' : ''}`}
                placeholder="alice@junia.com"
                value={form.email}
                onChange={(e) => field('email', e.target.value)}
                autoComplete="email"
              />
              {errors.email && <p className="text-xs text-danger mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="label">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  className={`input pr-10 ${errors.password ? 'border-danger/60' : ''}`}
                  placeholder="Minimum 6 caractères"
                  value={form.password}
                  onChange={(e) => field('password', e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-faint hover:text-ink transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d={showPwd
                        ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      }
                    />
                  </svg>
                </button>
              </div>
              {errors.password && <p className="text-xs text-danger mt-1">{errors.password}</p>}
              {form.password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((lvl) => (
                      <div key={lvl} className="h-0.5 flex-1 rounded-full transition-all duration-300"
                        style={{
                          background: lvl <= pwdStrength
                            ? pwdStrength === 3 ? '#10B981' : pwdStrength === 2 ? '#F59E0B' : '#EF4444'
                            : '#2D2D4A'
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-ink-faint">
                    {pwdStrength === 3 ? 'Robuste' : pwdStrength === 2 ? 'Acceptable' : 'Trop court'}
                  </p>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center py-3 disabled:opacity-50"
            >
              {loading ? (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : 'Créer mon compte →'}
            </button>
          </form>

          <p className="text-center text-sm text-ink-muted">
            Déjà un compte ?{' '}
            <Link to="/login" className="font-semibold hover:text-ink transition-colors" style={{ color: '#7C3AED' }}>
              Se connecter
            </Link>
          </p>
        </div>

        <p className="text-center text-[11px] text-ink-faint mt-6">
          JUNIA — Grande École d'Ingénieurs
        </p>
      </div>
    </div>
  );
}
