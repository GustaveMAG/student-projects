import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectsApi } from '../lib/api';
import ProgressBar from '../components/ProgressBar';
import toast from 'react-hot-toast';
import { format, isPast, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardPage() {
  const { user }    = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('');
  const [sortBy, setSortBy]     = useState('recent'); // recent | progression | retard

  useEffect(() => {
    projectsApi.dashboard()
      .then(({ data }) => setProjects(data))
      .catch(() => toast.error('Impossible de charger le tableau de bord'))
      .finally(() => setLoading(false));
  }, []);

  /* ── Filtrage + tri ── */
  const sorted = [...projects]
    .filter((p) => p.titre.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'progression') return Number(b.progression) - Number(a.progression);
      if (sortBy === 'retard')      return Number(b.nb_retard)   - Number(a.nb_retard);
      return 0; // recent = ordre API (created_at DESC)
    });

  /* ── KPIs globaux ── */
  const kpis = projects.reduce(
    (acc, p) => ({
      projets:  acc.projets  + 1,
      membres:  acc.membres  + Number(p.nb_membres  || 0),
      tasks:    acc.tasks    + Number(p.nb_tasks    || 0),
      done:     acc.done     + Number(p.nb_done     || 0),
      retard:   acc.retard   + Number(p.nb_retard   || 0),
    }),
    { projets: 0, membres: 0, tasks: 0, done: 0, retard: 0 }
  );
  const globalPct = kpis.tasks > 0 ? Math.round((kpis.done / kpis.tasks) * 100) : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-gray-400">
        <svg className="animate-spin w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm">Chargement du tableau de bord…</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ── En-tête ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bonjour, {user?.nom?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Vue globale de vos {projects.length} projet{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link to="/projects/new" className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouveau projet
        </Link>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          label="Projets"
          value={kpis.projets}
          icon="📁"
          color="purple"
          sub={`${kpis.membres} membres au total`}
        />
        <KpiCard
          label="Tâches totales"
          value={kpis.tasks}
          icon="📋"
          color="gray"
          sub={`sur tous les projets`}
        />
        <KpiCard
          label="Terminées"
          value={kpis.done}
          icon="✅"
          color="green"
          sub={`${globalPct}% de complétion`}
        />
        <KpiCard
          label="En retard"
          value={kpis.retard}
          icon="⚠️"
          color="red"
          sub={kpis.retard > 0 ? 'nécessitent attention' : 'Aucun retard 🎉'}
        />
        <div className="col-span-2 lg:col-span-1 card flex flex-col justify-between">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Progression globale</p>
          <div className="mt-3">
            <div className="flex items-end gap-2 mb-2">
              <span className="text-3xl font-bold text-purple-700">{globalPct}%</span>
            </div>
            <ProgressBar value={globalPct} showLabel={false} size="lg" />
          </div>
        </div>
      </div>

      {/* ── Filtres & tri ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="input pl-9"
            placeholder="Rechercher un projet…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Trier par :</span>
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
                  ? 'bg-purple-700 text-white'
                  : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tableau des projets ── */}
      {sorted.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-medium">Aucun projet trouvé</p>
          {filter && (
            <button onClick={() => setFilter('')} className="text-purple-600 text-sm mt-2 hover:underline">
              Effacer le filtre
            </button>
          )}
        </div>
      ) : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Projet</th>
                <th className="px-4 py-3.5 text-left font-semibold text-gray-600">Membres</th>
                <th className="px-4 py-3.5 text-left font-semibold text-gray-600">Tâches</th>
                <th className="px-4 py-3.5 text-left font-semibold text-gray-600">Retard</th>
                <th className="px-4 py-3.5 text-left font-semibold text-gray-600 min-w-[160px]">Progression</th>
                <th className="px-4 py-3.5 text-left font-semibold text-gray-600">Échéance</th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((p) => {
                const isLate   = p.date_fin && isPast(parseISO(p.date_fin)) && Number(p.progression) < 100;
                const pct      = Number(p.progression);
                return (
                  <tr key={p.id} className="hover:bg-purple-50/40 transition-colors group">
                    {/* Titre */}
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                        {p.titre}
                      </p>
                      {p.description && (
                        <p className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{p.description}</p>
                      )}
                    </td>

                    {/* Membres */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-gray-700">{p.nb_membres}</span>
                      </div>
                    </td>

                    {/* Tâches */}
                    <td className="px-4 py-4">
                      <span className="text-gray-700 font-medium">{p.nb_done}</span>
                      <span className="text-gray-400">/{p.nb_tasks}</span>
                    </td>

                    {/* Retard */}
                    <td className="px-4 py-4">
                      {Number(p.nb_retard) > 0 ? (
                        <span className="badge-late">
                          ⚠ {p.nb_retard}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>

                    {/* Progression */}
                    <td className="px-4 py-4 min-w-[160px]">
                      <ProgressBar value={pct} showLabel={false} size="sm" />
                      <span className="text-xs text-gray-500 mt-1 block">{pct}%</span>
                    </td>

                    {/* Échéance */}
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

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <Link
                        to={`/projects/${p.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-800 transition-colors"
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

      {/* ── Résumé rapide en bas ── */}
      {projects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard
            title="Projets terminés"
            value={projects.filter((p) => Number(p.progression) === 100).length}
            total={projects.length}
            color="green"
          />
          <SummaryCard
            title="En cours"
            value={projects.filter((p) => Number(p.progression) > 0 && Number(p.progression) < 100).length}
            total={projects.length}
            color="blue"
          />
          <SummaryCard
            title="Non démarrés"
            value={projects.filter((p) => Number(p.progression) === 0).length}
            total={projects.length}
            color="gray"
          />
        </div>
      )}
    </div>
  );
}

/* ── Sous-composants locaux ── */
function KpiCard({ label, value, icon, color, sub }) {
  const colors = {
    purple: 'text-purple-700',
    gray:   'text-gray-700',
    green:  'text-green-600',
    red:    'text-red-600',
  };
  return (
    <div className="card flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <span className={`text-3xl font-bold ${colors[color]}`}>{value}</span>
      <span className="text-xs text-gray-400">{sub}</span>
    </div>
  );
}

function SummaryCard({ title, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const bar = { green: 'bg-green-500', blue: 'bg-blue-500', gray: 'bg-gray-400' }[color];
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm ${bar}`}>
        {value}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-700">{title}</p>
        <p className="text-xs text-gray-400">{pct}% des projets</p>
      </div>
    </div>
  );
}
