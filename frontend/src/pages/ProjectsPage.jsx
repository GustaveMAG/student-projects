import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectsApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format, isPast, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ProjectsPage() {
  const { user }  = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('');

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
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-primary-muted">
        <svg className="animate-spin w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24">
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
      <div className="h-14 flex items-center justify-between px-6 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-primary">Mes projets</h1>
          <span className="text-[11px] text-primary-muted">{filtered.length} projet{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-1.5">
            <svg className="w-3.5 h-3.5 text-primary-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              className="bg-transparent outline-none text-primary placeholder-primary-muted w-40 text-sm"
              placeholder="Rechercher…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          {user.role === 'encadrant' && (
            <Link to="/projects/new" className="btn-primary text-xs py-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouveau projet
            </Link>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto p-6">
        {filtered.length === 0 ? (
          <EmptyState filter={filter} onClear={() => setFilter('')} role={user.role} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}
      </div>
    </>
  );
}

/* ── Project Card ── */
function ProjectCard({ project: p }) {
  const pct      = p.nb_tasks > 0 ? Math.round((p.nb_done / p.nb_tasks) * 100) : 0;
  const isLate   = p.date_fin && isPast(parseISO(p.date_fin)) && pct < 100;
  const nbRetard = Number(p.nb_retard || 0);
  const barColor = pct === 100 ? 'bg-success' : isLate ? 'bg-danger' : 'bg-accent';

  return (
    <Link
      to={`/projects/${p.id}`}
      className="bg-surface border border-border rounded-lg p-4 flex flex-col gap-3 hover:border-border-2 hover:bg-surface-2 transition-all group"
    >
      {/* Top */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-primary text-sm leading-snug line-clamp-2 group-hover:text-accent transition-colors">
          {p.titre}
        </h3>
        {pct === 100 && (
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
            <svg className="w-3 h-3 text-success" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </span>
        )}
      </div>

      {p.description && (
        <p className="text-[12px] text-primary-muted line-clamp-2 leading-relaxed">{p.description}</p>
      )}

      {/* Progress */}
      <div>
        <div className="h-1 bg-surface-2 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center justify-between mt-1.5 text-[11px]">
          <span className="text-primary-muted">
            {p.nb_done}/{p.nb_tasks} tâches
            {nbRetard > 0 && <span className="ml-1.5 text-danger">⚠ {nbRetard} retard{nbRetard > 1 ? 's' : ''}</span>}
          </span>
          <span className={`font-medium ${pct === 100 ? 'text-success' : 'text-primary-muted'}`}>{pct}%</span>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-primary-muted">
        <span className="truncate">{p.encadrant_nom}</span>
        {p.date_fin && (
          <span className={isLate ? 'text-danger' : ''}>
            {format(parseISO(p.date_fin), 'dd MMM yyyy', { locale: fr })}
          </span>
        )}
      </div>
    </Link>
  );
}

/* ── Empty state ── */
function EmptyState({ filter, onClear, role }) {
  return (
    <div className="card text-center py-20">
      <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center mx-auto mb-3">
        <svg className="w-5 h-5 text-primary-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-primary">
        {filter ? 'Aucun projet trouvé' : 'Aucun projet pour le moment'}
      </p>
      <p className="text-xs text-primary-muted mt-1">
        {filter
          ? `Aucun résultat pour « ${filter} »`
          : role === 'encadrant'
            ? 'Créez votre premier projet pour commencer.'
            : 'Un encadrant doit vous ajouter à un projet.'}
      </p>
      {filter ? (
        <button onClick={onClear} className="btn-ghost mt-4 mx-auto text-xs">
          Effacer la recherche
        </button>
      ) : role === 'encadrant' ? (
        <Link to="/projects/new" className="btn-primary mt-4 inline-flex mx-auto text-xs">
          Créer un projet
        </Link>
      ) : null}
    </div>
  );
}
