import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const ROLES = [
  {
    value: 'etudiant',
    label: 'Étudiant',
    icon: '🎓',
    description: 'Accédez à vos projets, gérez vos tâches et collaborez avec votre équipe.',
  },
  {
    value: 'encadrant',
    label: 'Encadrant',
    icon: '👨‍🏫',
    description: 'Supervisez plusieurs projets, pilotez les équipes et suivez l\'avancement.',
  },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [form, setForm] = useState({ nom: '', email: '', password: '', role: 'etudiant', code: '' });
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({});

  const validate = () => {
    const e = {};
    if (!form.nom.trim())                           e.nom      = 'Le nom est requis';
    if (!form.email.includes('@'))                  e.email    = 'Email invalide';
    if (form.password.length < 6)                  e.password = 'Minimum 6 caractères';
    if (form.role === 'encadrant' && !form.code.trim()) e.code = 'Code encadrant requis';
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

  return (
    <div className="min-h-screen flex">
      {/* ── Panneau gauche – branding ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-purple-600 opacity-20" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-indigo-500 opacity-20 translate-x-1/3 translate-y-1/3" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-400 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span className="text-white text-xl font-bold tracking-tight">ProjetsÉtudiants</span>
        </div>

        {/* Contenu central */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Rejoignez la<br />
              <span className="text-orange-400">plateforme.</span>
            </h1>
            <p className="text-purple-200 text-lg mt-4 leading-relaxed">
              Créez votre compte en quelques secondes et commencez à collaborer.
            </p>
          </div>

          {/* Étapes visuelles */}
          <div className="space-y-5">
            {[
              { step: '01', title: 'Créez votre compte', desc: 'Choisissez votre rôle et renseignez vos informations' },
              { step: '02', title: 'Rejoignez un projet', desc: 'Un encadrant vous intègre à son équipe' },
              { step: '03', title: 'Commencez à travailler', desc: 'Gérez vos tâches et déposez vos livrables' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex items-start gap-4">
                <span className="text-orange-400 font-bold text-sm w-6 flex-shrink-0">{step}</span>
                <div>
                  <p className="text-white font-medium text-sm">{title}</p>
                  <p className="text-purple-300 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center">
            <span className="text-white text-xs font-bold">J</span>
          </div>
          <span className="text-purple-300 text-sm">JUNIA — Grande École d'Ingénieurs</span>
        </div>
      </div>

      {/* ── Panneau droit – formulaire ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md space-y-7">

          {/* Header mobile */}
          <div className="lg:hidden flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-orange-400 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="font-bold text-gray-900">ProjetsÉtudiants</span>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-gray-900">Créer un compte</h2>
            <p className="mt-1 text-gray-500">Rejoignez la plateforme de gestion de projets</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Choix du rôle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Je suis…</label>
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map(({ value, label, icon, description }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => field('role', value)}
                    className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all cursor-pointer ${
                      form.role === value
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    {form.role === value && (
                      <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                    <span className="text-2xl">{icon}</span>
                    <span className={`text-sm font-semibold ${form.role === value ? 'text-purple-700' : 'text-gray-700'}`}>
                      {label}
                    </span>
                    <span className="text-xs text-gray-400 leading-tight">{description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Nom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom complet</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  className={`input pl-10 ${errors.nom ? 'border-red-400 focus:ring-red-400' : ''}`}
                  placeholder="Alice Martin"
                  value={form.nom}
                  onChange={(e) => field('nom', e.target.value)}
                  autoFocus
                />
              </div>
              {errors.nom && <p className="text-xs text-red-500 mt-1">{errors.nom}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  className={`input pl-10 ${errors.email ? 'border-red-400 focus:ring-red-400' : ''}`}
                  placeholder="alice@junia.com"
                  value={form.email}
                  onChange={(e) => field('email', e.target.value)}
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPwd ? 'text' : 'password'}
                  className={`input pl-10 pr-10 ${errors.password ? 'border-red-400 focus:ring-red-400' : ''}`}
                  placeholder="Minimum 6 caractères"
                  value={form.password}
                  onChange={(e) => field('password', e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPwd ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}

              {/* Force du mot de passe */}
              {form.password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((lvl) => {
                      const strength = form.password.length >= 10 ? 3 : form.password.length >= 6 ? 2 : 1;
                      return (
                        <div key={lvl} className={`h-1 flex-1 rounded-full transition-colors ${
                          lvl <= strength
                            ? strength === 3 ? 'bg-green-500' : strength === 2 ? 'bg-orange-400' : 'bg-red-400'
                            : 'bg-gray-200'
                        }`} />
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-400">
                    {form.password.length < 6 ? 'Trop court' : form.password.length < 10 ? 'Acceptable' : 'Robuste'}
                  </p>
                </div>
              )}
            </div>

            {/* Code encadrant (conditionnel) */}
            {form.role === 'encadrant' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Code d'accès encadrant</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    className={`input pl-10 ${errors.code ? 'border-red-400 focus:ring-red-400' : ''}`}
                    placeholder="Code fourni par l'administration"
                    value={form.code}
                    onChange={(e) => field('code', e.target.value)}
                    autoComplete="off"
                  />
                </div>
                {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
              </div>
            )}

            {/* Bouton */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-purple-700 px-4 py-3 text-sm font-semibold text-white hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Création du compte...
                </>
              ) : (
                <>
                  Créer mon compte
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600">
            Déjà un compte ?{' '}
            <Link to="/login" className="font-semibold text-purple-700 hover:text-purple-900 hover:underline transition-colors">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
