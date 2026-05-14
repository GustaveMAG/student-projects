import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const ROLES = [
  { value: 'etudiant',  label: 'Étudiant',   desc: 'Accédez à vos projets et gérez vos tâches' },
  { value: 'encadrant', label: 'Encadrant',   desc: 'Supervisez les projets et pilotez les équipes' },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [form, setForm]           = useState({ nom: '', email: '', password: '', role: 'etudiant' });
  const [showPwd, setShowPwd]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [errors, setErrors]       = useState({});

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
    <div className="min-h-screen bg-base flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span className="text-base font-semibold text-primary tracking-tight">ProjetsÉtudiants</span>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-xl p-6 space-y-5">
          <div>
            <h1 className="text-lg font-semibold text-primary">Créer un compte</h1>
            <p className="text-sm text-primary-muted mt-0.5">Rejoignez la plateforme JUNIA</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Role selector */}
            <div>
              <label className="label">Je suis…</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map(({ value, label, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => field('role', value)}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-all cursor-pointer ${
                      form.role === value
                        ? 'border-accent/60 bg-accent-soft text-primary'
                        : 'border-border bg-base text-primary-muted hover:border-border-2 hover:text-primary'
                    }`}
                  >
                    <span className={`text-xs font-semibold ${form.role === value ? 'text-accent' : ''}`}>
                      {label}
                    </span>
                    <span className="text-[10px] leading-tight opacity-70">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Nom */}
            <div>
              <label className="label">Nom complet</label>
              <input
                type="text"
                className={`input ${errors.nom ? 'border-danger/60 focus:ring-danger/30' : ''}`}
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
                className={`input ${errors.email ? 'border-danger/60 focus:ring-danger/30' : ''}`}
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
                  className={`input pr-10 ${errors.password ? 'border-danger/60 focus:ring-danger/30' : ''}`}
                  placeholder="Minimum 6 caractères"
                  value={form.password}
                  onChange={(e) => field('password', e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-primary-muted hover:text-primary transition-colors"
                >
                  {showPwd ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="text-xs text-danger mt-1">{errors.password}</p>}

              {/* Strength bar */}
              {form.password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((lvl) => (
                      <div
                        key={lvl}
                        className={`h-0.5 flex-1 rounded-full transition-colors ${
                          lvl <= pwdStrength
                            ? pwdStrength === 3 ? 'bg-success' : pwdStrength === 2 ? 'bg-warning' : 'bg-danger'
                            : 'bg-border-2'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-primary-muted">
                    {pwdStrength === 3 ? 'Robuste' : pwdStrength === 2 ? 'Acceptable' : 'Trop court'}
                  </p>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center py-2.5 text-sm font-medium mt-1 disabled:opacity-50"
            >
              {loading ? (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : 'Créer mon compte'}
            </button>
          </form>

          <p className="text-center text-sm text-primary-muted">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-accent hover:text-accent-hover transition-colors font-medium">
              Se connecter
            </Link>
          </p>
        </div>

        <p className="text-center text-[11px] text-primary-muted/50 mt-6">
          JUNIA — Grande École d'Ingénieurs
        </p>
      </div>
    </div>
  );
}
