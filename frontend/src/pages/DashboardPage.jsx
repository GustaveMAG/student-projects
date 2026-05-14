import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectsApi } from '../lib/api';
import toast from 'react-hot-toast';
import { format, isPast, parseISO, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardPage() {
  const { user }    = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('');
  const [sortBy, setSortBy]     = useState('recent');

  useEffect(() => {
    projectsApi.dashboard()
      .then(({ data }) => setProjects(data))
      .catch(() => toast.error('Impossible de charger le tableau de bord'))
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...projects]
    .filter((p) => p.titre.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'progression') return Number(b.progression) - Number(a.progression);
      if (sortBy === 'retard')      return Number(b.nb_retard)   - Number(a.nb_retard);
      return 0;
    });

  const kpis = projects.reduce(
    (acc, p) => ({
      projets: acc.projets + 1,
      tasks:   acc.tasks   + Number(p.nb_tasks   || 0),
      done:    acc.done    + Number(p.nb_done    || 0),
      retard:  acc.retard  + Number(p.nb_retard  || 0),
    }),
    { projets: 0, tasks: 0, done: 0, retard: 0 }
  );
  const globalPct = kpis.tasks > 0 ? Math.round((kpis.done / kpis.tasks) * 100) : 0;

  const getProjectStatus = (p) => {
    const pct = Number(p.progression);
    if (pct === 100) return { label: 'Terminé', cls: 'status-done-p', dot: 'bg-purple-500' };
    if (p.date_fin && isPast(parseISO(p.date_fin))) return { label: 'En retard', cls: 'status-late', dot: 'bg-red-500' };
    if (p.date_fin) {
      const days = differenceInDays(parseISO(p.date_fin), new Date());
      if (days <= 7 && pct < 60) return { label: 'À risque', cls: 'status-at-risk', dot: 'bg-yellow-500' };
    }
    return { label: 'En bonne voie', cls: 'status-on-track', dot: 'bg-green-500' };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-gray-400">
        <svg className="animate-spin w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm">Chargement…</span>
      </div>
    );
  }

  return (
    <>
      {/* ── Topbar ── */}
      <div className="bg-white border-b border-gray-200 px-7 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold text-gray-900">
            Bonjour, {user?.nom?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-400 border border-gray-200">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher un projet…"
              className="bg-transparent outline-none text-gray-700 w-44"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <Link to="/projects/new" className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau projet
          </Link>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="p-7 space-y-6 overflow-y-auto">

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Projets actifs"
            value={kpis.projets}
            icon="🗂️"
            iconBg="bg-primary-100"
            change={`${projects.filter(p => Number(p.progression) > 0 && Number(p.progression) < 100).length} en cours`}
            changeColor="text-blue-500"
          />
          <KpiCard
            label="Tâches en cours"
            value={projects.reduce((a, p) => a + Number(p.nb_tasks || 0) - Number(p.nb_done || 0), 0)}
            icon="⚡"
            iconBg="bg-accent-100"
            change={`${kpis.done} terminées`}
            changeColor="text-green-500"
          />
          <KpiCard
            label="Tâches terminées"
            value={kpis.done}
            icon="✅"
            iconBg="bg-green-100"
            change={`${globalPct}% de progression`}
            changeColor="text-green-500"
          />
          <KpiCard
            label="En retard"
            value={kpis.retard}
            icon="⚠️"
            iconBg="bg-red-100"
            change={kpis.retard > 0 ? 'nécessitent attention' : 'Aucun retard 🎉'}
            changeColor={kpis.retard > 0 ? 'text-red-500' : 'text-green-500'}
          />
        </div>

        {/* ── Progression globale ── */}
        <div className="bg-gradient-to-r from-primary-800 to-primary-700 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white/60 text-xs font-medium uppercase tracking-wider">Progression globale</p>
              <p className="text-3xl font-bold mt-1">{globalPct}%</p>
            </div>
            <div className="text-right text-sm text-white/70">
              <p>{kpis.done} / {kpis.tasks} tâches</p>
              <p className="text-white/50 text-xs mt-0.5">{kpis.projets} projets</p>
            </div>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-500 rounded-full transition-all duration-700"
              style={{ width: `${globalPct}%` }}
            />
          </div>
        </div>

        {/* ── Filtres ── */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">
            Mes projets <span className="text-gray-400 font-normal text-sm">({sorted.length})</span>
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Trier :</span>
            {[
              { value: 'recent',      label: 'Récent' },
              { value: 'progression', label: 'Progression' },
              { value: 'retard',      label: 'Retard' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setSortBy(value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  sortBy === value
                    ? 'bg-primary-800 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table projets ── */}
        {sorted.length === 0 ? (
          <div className="card text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-medium">Aucun projet trouvé</p>
            {filter && (
              <button onClick={() => setFilter('')} className="text-primary-600 text-sm mt-2 hover:underline">
                Effacer le filtre
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Projet</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Tâches</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[180px]">Progression</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Deadline</th>
                  <th className="px-4 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map((p) => {
                  const isLate = p.date_fin && isPast(parseISO(p.date_fin)) && Number(p.progression) < 100;
                  const pct    = Number(p.progression);
                  const status = getProjectStatus(p);
                  const progressColor = pct === 100 ? 'bg-green-500' : isLate ? 'bg-red-500' : pct >= 60 ? 'bg-primary-600' : 'bg-yellow-500';

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                          {p.titre}
                        </p>
                        {p.description && (
                          <p className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{p.description}</p>
                        )}
                        <div className="flex items-center gap-1 mt-1.5">
                          {[...Array(Math.min(Number(p.nb_membres) || 0, 4))].map((_, i) => (
                            <div
                              key={i}
                              className="w-5 h-5 rounded-full border border-white flex items-center justify-center text-[9px] font-bold text-white -ml-1 first:ml-0"
                              style={{ background: `hsl(${(i * 60 + 200)}deg 60% 55%)` }}
                            >
                              {String.fromCharCode(65 + i)}
                            </div>
                          ))}
                          {Number(p.nb_membres) > 0 && (
                            <span className="text-xs text-gray-400 ml-1">{p.nb_membres} membre{p.nb_membres > 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span className="font-semibold text-gray-800">{p.nb_done}</span>
                        <span className="text-gray-400">/{p.nb_tasks}</span>
                        {Number(p.nb_retard) > 0 && (
                          <div className="mt-1">
                            <span className="badge-late">⚠ {p.nb_retard} retard{p.nb_retard > 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-4 min-w-[180px]">
                        <div className="flex items-center gap-2.5">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${progressColor}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-600 w-9 text-right">{pct}%</span>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span className={status.cls}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        {p.date_fin ? (
                          <span className={`text-xs font-medium ${isLate ? 'text-red-500' : 'text-gray-600'}`}>
                            {isLate && '⚠ '}
                            {format(parseISO(p.date_fin), 'dd MMM yyyy', { locale: fr })}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <Link
                          to={`/projects/${p.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:text-primary-900 transition-colors bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg"
                        >
                          Voir
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Résumé bas ── */}
        {projects.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Terminés', value: projects.filter(p => Number(p.progression) === 100).length, color: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50' },
              { label: 'En cours', value: projects.filter(p => Number(p.progression) > 0 && Number(p.progression) < 100).length, color: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Non démarrés', value: projects.filter(p => Number(p.progression) === 0).length, color: 'bg-gray-400', text: 'text-gray-600', bg: 'bg-gray-50' },
            ].map(({ label, value, color, text, bg }) => (
              <div key={label} className={`rounded-xl border border-gray-200 ${bg} p-4 flex items-center gap-4`}>
                <div className={`w-11 h-11 rounded-full ${color} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
                  {value}
                </div>
                <div>
                  <p className={`font-semibold ${text}`}>{label}</p>
                  <p className="text-xs text-gray-400">
                    {projects.length > 0 ? Math.round((value / projects.length) * 100) : 0}% des projets
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function KpiCard({ label, value, icon, iconBg, change, changeColor }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{label}</p>
        <p className="text-3xl font-bold text-gray-900 leading-none">{value}</p>
        <p className={`text-xs mt-2 font-medium ${changeColor}`}>{change}</p>
      </div>
      <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center text-xl flex-shrink-0`}>
        {icon}
      </div>
    </div>
  );
}
