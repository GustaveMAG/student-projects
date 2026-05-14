import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectsApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import ProgressBar from '../components/ProgressBar';
import toast from 'react-hot-toast';
import { format, isPast, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ProjectsPage() {
  const { user }  = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('');
  const [view, setView]         = useState('grid'); // grid | list

  useEffect(() => {
    projectsApi.list()
      .then(({ data }) => setProjects(data))
      .catch(() => toast.error('Impossible de charger les projets'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = projects.filter((p) =>
    p.titre.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-gray-400">
        <svg className="animate-spin w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm">Chargement des projets…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── En-tête ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user.role === 'encadrant' ? 'Mes projets' : 'Mes projets'}
          </h1>
          <p className="text-gray-500 mt-1">
            {filtered.length} projet{filtered.length !== 1 ? 's' : ''}
            {filter && ` pour « ${filter} »`}
          </p>
        </div>
        {user.role === 'encadrant' && (
          <Link to="/projects/new" className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau projet
          </Link>
        )}
      </div>

      {/* ── Barre recherche + toggle vue ── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
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

        {/* Toggle grille / liste */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => setView('grid')}
            className={`p-2 transition-colors ${view === 'grid' ? 'bg-purple-700 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
            title="Vue grille"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z" />
            </svg>
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-2 transition-colors ${view === 'list' ? 'bg-purple-700 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
            title="Vue liste"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Contenu ── */}
      {filtered.length === 0 ? (
        <EmptyState filter={filter} onClear={() => setFilter('')} role={user.role} />
      ) : view === 'grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      ) : (
        <div className="card p-0 divide-y divide-gray-100">
          {filtered.map((p) => <ProjectRow key={p.id} project={p} />)}
        </div>
      )}
    </div>
  );
}

/* ── Carte grille ── */
function ProjectCard({ project: p }) {
  const pct    = p.nb_tasks > 0 ? Math.round((p.nb_done / p.nb_tasks) * 100) : 0;
  const isLate = p.date_fin && isPast(parseISO(p.date_fin)) && pct < 100;
  const nbRetard = Number(p.nb_retard || 0);

  return (
    <Link
      to={`/projects/${p.id}`}
      className="card hover:shadow-md hover:-translate-y-0.5 transition-all block group relative overflow-hidden"
    >
      {/* Bandeau retard */}
      {isLate && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 rounded-t-xl" />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors line-clamp-2 leading-snug">
          {p.titre}
        </h3>
        {pct === 100 && (
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </span>
        )}
      </div>

      {p.description && (
        <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">{p.description}</p>
      )}

      {/* Progression */}
      <ProgressBar value={pct} size="sm" showLabel={false} />

      {/* Stats */}
      <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {p.nb_done}/{p.nb_tasks} tâches
          </span>
          {nbRetard > 0 && (
            <span className="badge-late text-xs py-0">⚠ {nbRetard}</span>
          )}
        </div>
        <span className="font-semibold text-purple-700">{pct}%</span>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {p.encadrant_nom}
        </span>
        {p.date_fin && (
          <span className={isLate ? 'text-red-400 font-medium' : ''}>
            {isLate ? '⚠ ' : ''}
            {format(parseISO(p.date_fin), 'dd MMM yyyy', { locale: fr })}
          </span>
        )}
      </div>
    </Link>
  );
}

/* ── Ligne vue liste ── */
function ProjectRow({ project: p }) {
  const pct    = p.nb_tasks > 0 ? Math.round((p.nb_done / p.nb_tasks) * 100) : 0;
  const isLate = p.date_fin && isPast(parseISO(p.date_fin)) && pct < 100;

  return (
    <Link
      to={`/projects/${p.id}`}
      className="flex items-center gap-4 px-5 py-4 hover:bg-purple-50/40 transition-colors group"
    >
      {/* Indicateur couleur */}
      <div className={`w-1.5 h-10 rounded-full flex-shrink-0 ${
        pct === 100 ? 'bg-green-500' : isLate ? 'bg-red-400' : pct > 0 ? 'bg-purple-500' : 'bg-gray-300'
      }`} />

      {/* Titre + description */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors truncate">
          {p.titre}
        </p>
        {p.description && (
          <p className="text-xs text-gray-400 truncate mt-0.5">{p.description}</p>
        )}
      </div>

      {/* Tâches */}
      <div className="hidden sm:block text-sm text-gray-600 w-20 text-center flex-shrink-0">
        <span className="font-medium">{p.nb_done}</span>
        <span className="text-gray-400">/{p.nb_tasks}</span>
      </div>

      {/* Barre */}
      <div className="hidden md:block w-32 flex-shrink-0">
        <ProgressBar value={pct} showLabel={false} size="sm" />
        <span className="text-xs text-gray-400 mt-0.5 block text-right">{pct}%</span>
      </div>

      {/* Échéance */}
      <div className="hidden lg:block text-xs flex-shrink-0 w-24">
        {p.date_fin ? (
          <span className={isLate ? 'text-red-500 font-medium' : 'text-gray-500'}>
            {format(parseISO(p.date_fin), 'dd MMM yyyy', { locale: fr })}
          </span>
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </div>

      {/* Flèche */}
      <svg className="w-4 h-4 text-gray-300 group-hover:text-purple-500 transition-colors flex-shrink-0"
        fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

/* ── État vide ── */
function EmptyState({ filter, onClear, role }) {
  return (
    <div className="card text-center py-20">
      <div className="text-5xl mb-4">{filter ? '🔍' : '📂'}</div>
      <h3 className="text-lg font-semibold text-gray-700">
        {filter ? 'Aucun projet trouvé' : 'Aucun projet pour le moment'}
      </h3>
      <p className="text-gray-400 text-sm mt-1">
        {filter
          ? `Aucun résultat pour « ${filter} »`
          : role === 'encadrant'
            ? 'Créez votre premier projet pour commencer.'
            : 'Un encadrant doit vous ajouter à un projet.'}
      </p>
      {filter ? (
        <button onClick={onClear} className="btn-secondary mt-4 mx-auto">
          Effacer la recherche
        </button>
      ) : role === 'encadrant' ? (
        <Link to="/projects/new" className="btn-primary mt-4 inline-flex mx-auto">
          Créer un projet
        </Link>
      ) : null}
    </div>
  );
}
