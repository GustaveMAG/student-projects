import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { projectsApi, tasksApi, deliverablesApi, usersApi, fileUrl } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import KanbanBoard from '../components/KanbanBoard';
import toast from 'react-hot-toast';
import { format, isPast, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const TABS = [
  { key: 'tasks',        label: 'Tâches' },
  { key: 'deliverables', label: 'Livrables' },
  { key: 'members',      label: 'Équipe' },
];

export default function ProjectDetailPage() {
  const { id }      = useParams();
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const isEncadrant = user.role === 'encadrant';

  const [project, setProject]           = useState(null);
  const [tasks, setTasks]               = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [allStudents, setAllStudents]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState('tasks');
  const [taskFilter, setTaskFilter]     = useState('all');
  const [taskView, setTaskView]         = useState('list');

  const load = useCallback(async () => {
    try {
      const [pRes, tRes, dRes] = await Promise.all([
        projectsApi.get(id),
        tasksApi.list(id),
        deliverablesApi.list(id),
      ]);
      setProject(pRes.data);
      setTasks(tRes.data);
      setDeliverables(dRes.data);
      if (isEncadrant) {
        const { data } = await usersApi.list({ role: 'etudiant' });
        setAllStudents(data);
      }
    } catch {
      toast.error('Projet introuvable');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  }, [id, isEncadrant, navigate]);

  useEffect(() => { load(); }, [load]);

  /* ── Actions ── */
  const handleDeleteProject = async () => {
    if (!window.confirm(`Supprimer le projet « ${project.titre} » ?`)) return;
    try {
      await projectsApi.remove(id);
      toast.success('Projet supprimé');
      navigate('/projects');
    } catch { toast.error('Impossible de supprimer'); }
  };

  const handleAddMember = async (userId) => {
    try {
      await projectsApi.addMember(id, { user_id: userId });
      toast.success('Membre ajouté');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
  };

  const handleRemoveMember = async (userId, nom) => {
    if (!window.confirm(`Retirer ${nom} du projet ?`)) return;
    try {
      await projectsApi.removeMember(id, userId);
      toast.success(`${nom} retiré`);
      load();
    } catch { toast.error('Impossible de retirer'); }
  };

  const handleStatusChange = async (taskId, statut) => {
    try {
      await tasksApi.updateStatus(id, taskId, statut);
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, statut } : t));
    } catch { toast.error('Impossible de mettre à jour'); }
  };

  const handleDeleteTask = async (taskId, titre) => {
    if (!window.confirm(`Supprimer la tâche « ${titre} » ?`)) return;
    try {
      await tasksApi.remove(id, taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast.success('Tâche supprimée');
    } catch { toast.error('Impossible de supprimer'); }
  };

  const handleDownload = async (url, nom) => {
    try {
      const fullUrl = fileUrl(url);
      const res = await fetch(fullUrl);
      if (!res.ok) throw new Error('Fichier introuvable');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl; a.download = nom;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch { toast.error('Impossible de télécharger'); }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    const toastId = toast.loading(`Envoi de ${file.name}…`);
    try {
      const { data } = await deliverablesApi.upload(id, fd);
      setDeliverables((prev) => [data, ...prev]);
      toast.success('Fichier déposé', { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de l'upload", { id: toastId });
    }
    e.target.value = '';
  };

  const handleDeleteDeliverable = async (delId, nom) => {
    if (!window.confirm(`Supprimer « ${nom} » ?`)) return;
    try {
      await deliverablesApi.remove(id, delId);
      setDeliverables((prev) => prev.filter((d) => d.id !== delId));
      toast.success('Livrable supprimé');
    } catch { toast.error('Impossible de supprimer'); }
  };

  /* ── Loading ── */
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
  if (!project) return null;

  const doneTasks     = tasks.filter((t) => t.statut === 'done').length;
  const lateTasks     = tasks.filter((t) => t.deadline && isPast(parseISO(t.deadline)) && t.statut !== 'done').length;
  const pct           = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;
  const memberIds     = project.members.map((m) => m.id);
  const nonMembers    = allStudents.filter((s) => !memberIds.includes(s.id));
  const filteredTasks = taskFilter === 'all' ? tasks : tasks.filter((t) => t.statut === taskFilter);
  const tabCounts     = { tasks: tasks.length, deliverables: deliverables.length, members: project.members.length };

  return (
    <>
      {/* ── Header ── */}
      <div className="border-b border-border px-6 pt-5 pb-0 bg-base flex-shrink-0">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-primary-muted mb-3">
          <Link to="/projects" className="hover:text-primary transition-colors">Projets</Link>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-primary truncate">{project.titre}</span>
        </nav>

        {/* Title row */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-primary leading-tight">{project.titre}</h1>
            {project.description && (
              <p className="text-xs text-primary-muted mt-1 max-w-xl">{project.description}</p>
            )}
          </div>
          {isEncadrant && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link to={`/projects/${id}/edit`} className="btn-ghost text-xs py-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Modifier
              </Link>
              <button onClick={handleDeleteProject} className="btn-danger text-xs py-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Supprimer
              </button>
            </div>
          )}
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-primary-muted">
          <span>Encadrant : <span className="text-primary font-medium">{project.encadrant_nom}</span></span>

          {/* Member avatars */}
          <div className="flex items-center gap-1">
            {project.members.slice(0, 4).map((m, i) => (
              <div
                key={m.id}
                className="w-5 h-5 rounded-full border border-base flex items-center justify-center text-[9px] font-semibold text-white -ml-1 first:ml-0"
                style={{ background: `hsl(${(i * 70 + 200)}deg 50% 50%)` }}
                title={m.nom}
              >
                {m.nom.charAt(0)}
              </div>
            ))}
            <span className="ml-1">{project.members.length} membre{project.members.length !== 1 ? 's' : ''}</span>
          </div>

          {project.date_fin && (
            <span className={isPast(parseISO(project.date_fin)) && pct < 100 ? 'text-danger' : ''}>
              {isPast(parseISO(project.date_fin)) && pct < 100 ? '⚠ ' : ''}
              Deadline : {format(parseISO(project.date_fin), 'dd MMM yyyy', { locale: fr })}
            </span>
          )}

          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
            pct === 100 ? 'bg-success/10 text-success border border-success/20'
            : lateTasks > 0 ? 'bg-danger/10 text-danger border border-danger/20'
            : 'bg-accent/10 text-accent border border-accent/20'
          }`}>
            <span className={`w-1 h-1 rounded-full ${pct === 100 ? 'bg-success' : lateTasks > 0 ? 'bg-danger' : 'bg-accent'}`} />
            {pct === 100 ? 'Terminé' : lateTasks > 0 ? `${lateTasks} en retard` : 'En bonne voie'}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-[11px] text-primary-muted mb-1">
            <span>Progression</span>
            <span>{doneTasks}/{tasks.length} tâches · {pct}%</span>
          </div>
          <div className="h-1 bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Tabs */}
        <nav className="flex gap-0 mt-4 -mb-px">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                tab === key
                  ? 'border-accent text-primary'
                  : 'border-transparent text-primary-muted hover:text-primary'
              }`}
            >
              {label}
              <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-semibold ${
                tab === key ? 'bg-accent/20 text-accent' : 'bg-surface-2 text-primary-muted'
              }`}>
                {tabCounts[key]}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* ── Tab Content ── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">

        {/* ══ TÂCHES ══ */}
        {tab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Filter buttons (list view only) */}
                {taskView === 'list' && (
                  <div className="flex gap-1.5 flex-wrap">
                    {[
                      { value: 'all',         label: 'Toutes',    count: tasks.length },
                      { value: 'todo',        label: 'À faire',   count: tasks.filter((t) => t.statut === 'todo').length },
                      { value: 'in_progress', label: 'En cours',  count: tasks.filter((t) => t.statut === 'in_progress').length },
                      { value: 'done',        label: 'Terminées', count: tasks.filter((t) => t.statut === 'done').length },
                    ].map(({ value, label, count }) => (
                      <button
                        key={value}
                        onClick={() => setTaskFilter(value)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                          taskFilter === value
                            ? 'bg-accent/20 text-accent border border-accent/30'
                            : 'text-primary-muted hover:text-primary border border-border hover:border-border-2'
                        }`}
                      >
                        {label} ({count})
                      </button>
                    ))}
                  </div>
                )}

                {/* View toggle */}
                <div className="flex rounded-md border border-border overflow-hidden">
                  <button
                    onClick={() => setTaskView('list')}
                    title="Vue liste"
                    className={`px-2.5 py-1 text-[11px] flex items-center gap-1 transition-colors ${
                      taskView === 'list' ? 'bg-accent/20 text-accent' : 'text-primary-muted hover:text-primary'
                    }`}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    Liste
                  </button>
                  <button
                    onClick={() => setTaskView('kanban')}
                    title="Vue Kanban"
                    className={`px-2.5 py-1 text-[11px] flex items-center gap-1 transition-colors border-l border-border ${
                      taskView === 'kanban' ? 'bg-accent/20 text-accent' : 'text-primary-muted hover:text-primary'
                    }`}
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z" />
                    </svg>
                    Kanban
                  </button>
                </div>
              </div>

              {isEncadrant && (
                <Link to={`/projects/${id}/tasks/new`} className="btn-primary text-xs py-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Nouvelle tâche
                </Link>
              )}
            </div>

            {taskView === 'kanban' ? (
              tasks.length === 0 ? (
                <EmptyState msg="Aucune tâche pour ce projet" />
              ) : (
                <KanbanBoard
                  tasks={tasks}
                  projectId={id}
                  userId={user.id}
                  isEncadrant={isEncadrant}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDeleteTask}
                />
              )
            ) : (
              filteredTasks.length === 0 ? (
                <EmptyState msg={taskFilter === 'all' ? 'Aucune tâche' : 'Aucune tâche dans ce statut'} />
              ) : (
                <div className="space-y-2">
                  {filteredTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      projectId={id}
                      userId={user.id}
                      isEncadrant={isEncadrant}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDeleteTask}
                    />
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {/* ══ LIVRABLES ══ */}
        {tab === 'deliverables' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-primary-muted">
                {deliverables.length} fichier{deliverables.length !== 1 ? 's' : ''} déposé{deliverables.length !== 1 ? 's' : ''}
              </span>
              <label className="btn-primary text-xs py-1.5 cursor-pointer">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Déposer un fichier
                <input type="file" className="hidden" onChange={handleUpload} />
              </label>
            </div>

            {deliverables.length === 0 ? (
              <EmptyState msg="Aucun livrable déposé" />
            ) : (
              <div className="bg-surface border border-border rounded-lg divide-y divide-border">
                {deliverables.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2 transition-colors">
                    {/* File icon */}
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 text-sm">
                      {getFileIcon(d.nom_fichier)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <a
                        href={fileUrl(d.url)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-primary hover:text-accent transition-colors truncate block"
                      >
                        {d.nom_fichier}
                      </a>
                      <p className="text-[11px] text-primary-muted mt-0.5">
                        Par <span className="text-primary">{d.uploade_par_nom}</span>
                        {' · '}
                        {format(parseISO(d.created_at), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleDownload(d.url, d.nom_fichier)}
                        className="text-primary-muted hover:text-primary transition-colors"
                        title="Télécharger"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                      {(isEncadrant || d.uploade_par === user.id) && (
                        <button
                          onClick={() => handleDeleteDeliverable(d.id, d.nom_fichier)}
                          className="text-primary-muted hover:text-danger transition-colors"
                          title="Supprimer"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ ÉQUIPE ══ */}
        {tab === 'members' && (
          <div className="space-y-4">
            {/* Members list */}
            {project.members.length === 0 ? (
              <EmptyState msg="Aucun membre dans ce projet" />
            ) : (
              <div className="bg-surface border border-border rounded-lg divide-y divide-border">
                {project.members.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                      style={{ background: `hsl(${m.nom.charCodeAt(0) * 5 % 360}deg 50% 45%)` }}
                    >
                      {m.nom.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary">{m.nom}</p>
                      <p className="text-[11px] text-primary-muted truncate">{m.email}</p>
                    </div>
                    <span className="badge-todo text-[10px] flex-shrink-0">Étudiant</span>
                    {isEncadrant && (
                      <button
                        onClick={() => handleRemoveMember(m.id, m.nom)}
                        className="text-primary-muted hover:text-danger transition-colors flex-shrink-0"
                        title={`Retirer ${m.nom}`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Supervisor row */}
            <div className="bg-surface border border-border rounded-lg px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                {project.encadrant_nom.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary">{project.encadrant_nom}</p>
                <p className="text-[11px] text-primary-muted">Responsable du projet</p>
              </div>
              <span className="badge-progress text-[10px] flex-shrink-0">Encadrant</span>
            </div>

            {/* Add members */}
            {isEncadrant && nonMembers.length > 0 && (
              <div className="bg-surface border border-border rounded-lg p-4">
                <h3 className="text-xs font-semibold text-primary mb-3">Ajouter un étudiant</h3>
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {nonMembers.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 hover:bg-surface-2 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-surface-2 border border-border flex items-center justify-center text-primary-muted text-[10px] font-semibold flex-shrink-0">
                          {s.nom.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-primary truncate">{s.nom}</p>
                          <p className="text-[10px] text-primary-muted truncate">{s.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddMember(s.id)}
                        className="flex-shrink-0 text-[11px] font-medium text-accent hover:text-accent-hover border border-accent/30 hover:border-accent/60 rounded-md px-2.5 py-1 transition-colors"
                      >
                        + Ajouter
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {isEncadrant && nonMembers.length === 0 && project.members.length > 0 && (
              <p className="text-center text-xs text-primary-muted">Tous les étudiants sont déjà dans ce projet.</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}

/* ── Task card ── */
function TaskCard({ task, projectId, userId, isEncadrant, onStatusChange, onDelete }) {
  const isLate = task.deadline && isPast(parseISO(task.deadline)) && task.statut !== 'done';
  const canEdit = isEncadrant || task.assigne_a === userId;

  const statusMap = {
    todo:        'badge-todo',
    in_progress: 'badge-progress',
    done:        'badge-done',
  };
  const statusLabels = { todo: 'À faire', in_progress: 'En cours', done: 'Terminé' };

  return (
    <div className={`bg-surface border rounded-lg p-4 flex gap-4 hover:border-border-2 transition-colors ${
      isLate ? 'border-danger/30 bg-danger/5' : 'border-border'
    }`}>
      {/* Status selector */}
      <div className="flex-shrink-0 pt-0.5">
        <select
          value={task.statut}
          onChange={(e) => onStatusChange(task.id, e.target.value)}
          className="bg-surface-2 border border-border rounded-md text-[11px] text-primary-muted focus:ring-accent/30 cursor-pointer py-1 px-1.5"
        >
          <option value="todo">À faire</option>
          <option value="in_progress">En cours</option>
          <option value="done">Terminé</option>
        </select>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <Link
            to={`/projects/${projectId}/tasks/${task.id}`}
            className={`text-sm font-medium hover:text-accent transition-colors leading-tight ${
              task.statut === 'done' ? 'line-through text-primary-muted' : 'text-primary'
            }`}
          >
            {task.titre}
          </Link>
          <span className={`${statusMap[task.statut] || 'badge-todo'} flex-shrink-0`}>
            {statusLabels[task.statut]}
          </span>
        </div>

        {task.description && (
          <p className="text-[11px] text-primary-muted mt-1 line-clamp-1">{task.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-primary-muted">
          {task.assignee_nom && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {task.assignee_nom}
            </span>
          )}
          {task.deadline && (
            <span className={`flex items-center gap-1 ${isLate ? 'text-danger font-medium' : ''}`}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {isLate && '⚠ '}
              {format(parseISO(task.deadline), 'dd MMM yyyy', { locale: fr })}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      {canEdit && (
        <div className="flex flex-col items-end gap-1 flex-shrink-0 text-[11px]">
          <Link to={`/projects/${projectId}/tasks/${task.id}/edit`} className="text-primary-muted hover:text-primary transition-colors">
            Modifier
          </Link>
          <button onClick={() => onDelete(task.id, task.titre)} className="text-primary-muted hover:text-danger transition-colors">
            Supprimer
          </button>
          <Link to={`/projects/${projectId}/tasks/${task.id}`} className="text-accent/70 hover:text-accent transition-colors mt-0.5">
            Commentaires →
          </Link>
        </div>
      )}
    </div>
  );
}

/* ── Empty state ── */
function EmptyState({ msg }) {
  return (
    <div className="card text-center py-14">
      <p className="text-sm text-primary-muted">{msg}</p>
    </div>
  );
}

/* ── File icon ── */
function getFileIcon(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  const map = {
    pdf: '📄', doc: '📝', docx: '📝',
    xls: '📊', xlsx: '📊', csv: '📊',
    ppt: '📑', pptx: '📑',
    zip: '🗜️', rar: '🗜️',
    jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', svg: '🖼️',
    mp4: '🎬', avi: '🎬', mov: '🎬',
    mp3: '🎵', wav: '🎵',
    txt: '📃',
  };
  return map[ext] || '📎';
}
