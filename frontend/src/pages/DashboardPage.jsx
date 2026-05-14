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
    if (pct === 100) return { label: 'Terminé', cls: 'badge-done' };
    if (p.date_fin && isPast(parseISO(p.date_fin))) return { label: 'En retard', cls: 'badge-late' };
    if (p.date_fin) {
      const days = differenceInDays(parseISO(p.date_fin), new Date());
      if (days <= 7 && pct < 60) return { label: 'À risque', cls: 'badge-warning' };
    }
    return { label: 'En bonne voie', cls: 'badge-progress' };
  };

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
        <div>
          <h1 className="text-sm font-semibold text-primary">
            Bonjour, {user?.nom?.split(' ')[0]}
          </h1>
          <p className="text-[11px] text-primary-muted mt-0.5 capitalize">
            {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-primary-muted">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher un projet…"
              className="bg-transparent outline-none text-primary placeholder-primary-muted w-40 text-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <Link to="/projects/new" className="btn-primary text-xs py-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau projet
          </Link>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* ── KPI row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            label="Projets actifs"
            value={kpis.projets}
            sub={`${projects.filter(p => Number(p.progression) > 0 && Number(p.progression) < 100).length} en cours`}
            icon={<IconFolder />}
          />
          <KpiCard
            label="Tâches en cours"
            value={projects.reduce((a, p) => a + Number(p.nb_tasks || 0) - Number(p.nb_done || 0), 0)}
            sub={`${kpis.done} terminées`}
            icon={<IconTask />}
            accent
          />
          <KpiCard
            label="Tâches terminées"
            value={kpis.done}
            sub={`${globalPct}% progression`}
            icon={<IconCheck />}
            success
          />
          <KpiCard
            label="En retard"
            value={kpis.retard}
            sub={kpis.retard > 0 ? 'nécessitent attention' : 'Aucun retard'}
            icon={<IconAlert />}
            danger={kpis.retard > 0}
          />
        </div>

        {/* ── Projects table header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-primary">
              Projets
              <span className="ml-2 text-xs font-normal text-primary-muted">({sorted.length})</span>
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-primary-muted">Trier :</span>
            {[
              { value: 'recent',      label: 'Récent' },
              { value: 'progression', label: 'Progression' },
              { value: 'retard',      label: 'Retard' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setSortBy(value)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  sortBy === value
                    ? 'bg-accent/20 text-accent border border-accent/30'
                    : 'text-primary-muted hover:text-primary hover:bg-surface-2 border border-transparent'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table ── */}
        {sorted.length === 0 ? (
          <div className="card text-center py-16">
            <p className="text-primary-muted text-sm">
              {filter ? `Aucun résultat pour « ${filter} »` : 'Aucun projet'}
            </p>
            {filter && (
              <button onClick={() => setFilter('')} className="text-accent text-xs mt-2 hover:underline">
                Effacer le filtre
              </button>
            )}
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="th">Projet</th>
                  <th className="th">Tâches</th>
                  <th className="th min-w-[160px]">Progression</th>
                  <th className="th">Statut</th>
                  <th className="th">Deadline</th>
                  <th className="th w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sorted.map((p) => {
                  const isLate = p.date_fin && isPast(parseISO(p.date_fin)) && Number(p.progression) < 100;
                  const pct    = Number(p.progression);
                  const status = getProjectStatus(p);
                  const barColor = pct === 100 ? 'bg-success' : isLate ? 'bg-danger' : pct >= 60 ? 'bg-accent' : 'bg-warning';

                  return (
                    <tr key={p.id} className="table-row-hover">
                      <td className="td">
                        <p className="font-medium text-primary text-sm">{p.titre}</p>
                        {p.description && (
                          <p className="text-[11px] text-primary-muted mt-0.5 max-w-xs truncate">{p.description}</p>
                        )}
                        {Number(p.nb_membres) > 0 && (
                          <div className="flex items-center gap-1 mt-1.5">
                            {[...Array(Math.min(Number(p.nb_membres), 4))].map((_, i) => (
                              <div
                                key={i}
                                className="w-5 h-5 rounded-full border border-base flex items-center justify-center text-[9px] font-semibold text-white -ml-1 first:ml-0"
                                style={{ background: `hsl(${(i * 60 + 200)}deg 50% 50%)` }}
                              >
                                {String.fromCharCode(65 + i)}
                              </div>
                            ))}
                            <span className="text-[11px] text-primary-muted ml-1">
                              {p.nb_membres} membre{p.nb_membres > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="td">
                        <span className="font-medium text-primary">{p.nb_done}</span>
                        <span className="text-primary-muted">/{p.nb_tasks}</span>
                        {Number(p.nb_retard) > 0 && (
                          <div className="mt-1">
                            <span className="badge-late">⚠ {p.nb_retard} retard{p.nb_retard > 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </td>

                      <td className="td min-w-[160px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${barColor}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-primary-muted w-8 text-right">{pct}%</span>
                        </div>
                      </td>

                      <td className="td">
                        <span className={status.cls}>{status.label}</span>
                      </td>

                      <td className="td">
                        {p.date_fin ? (
                          <span className={`text-xs ${isLate ? 'text-danger' : 'text-primary-muted'}`}>
                            {format(parseISO(p.date_fin), 'dd MMM yyyy', { locale: fr })}
                          </span>
                        ) : (
                          <span className="text-primary-muted text-xs">—</span>
                        )}
                      </td>

                      <td className="td">
                        <Link
                          to={`/projects/${p.id}`}
                          className="text-primary-muted hover:text-accent transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      </div>
    </>
  );
}

/* ── KPI Card ── */
function KpiCard({ label, value, sub, icon, accent, success, danger }) {
  const iconBg = danger ? 'bg-danger/10 text-danger'
    : success ? 'bg-success/10 text-success'
    : accent  ? 'bg-accent/10 text-accent'
    : 'bg-surface-2 text-primary-muted';

  return (
    <div className="bg-surface border border-border rounded-lg p-4 flex items-start justify-between gap-3">
      <div>
        <p className="label mb-1.5">{label}</p>
        <p className="text-2xl font-bold text-primary leading-none">{value}</p>
        <p className={`text-[11px] mt-1.5 font-medium ${
          danger ? 'text-danger' : success ? 'text-success' : 'text-primary-muted'
        }`}>{sub}</p>
      </div>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
    </div>
  );
}

/* ── Icons ── */
function IconFolder() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}
function IconTask() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 13l4 4L19 7" />
    </svg>
  );
}
function IconAlert() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}
