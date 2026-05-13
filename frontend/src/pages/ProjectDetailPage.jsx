import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { projectsApi, tasksApi, deliverablesApi, usersApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import ProgressBar from '../components/ProgressBar';
import TaskStatusBadge from '../components/TaskStatusBadge';
import toast from 'react-hot-toast';
import { format, isPast, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const TABS = [
  { key: 'tasks',        label: 'Tâches',    icon: '📋' },
  { key: 'deliverables', label: 'Livrables', icon: '📁' },
  { key: 'members',      label: 'Équipe',    icon: '👥' },
];

export default function ProjectDetailPage() {
  const { id }        = useParams();
  const { user }      = useAuth();
  const navigate      = useNavigate();
  const isEncadrant   = user.role === 'encadrant';

  const [project, setProject]           = useState(null);
  const [tasks, setTasks]               = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [allStudents, setAllStudents]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState('tasks');
  const [taskFilter, setTaskFilter]     = useState('all'); // all | todo | in_progress | done

  /* ── Chargement initial ── */
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

  /* ── Actions projet ── */
  const handleDeleteProject = async () => {
    if (!window.confirm(`Supprimer le projet « ${project.titre} » ? Cette action est irréversible.`)) return;
    try {
      await projectsApi.remove(id);
      toast.success('Projet supprimé');
      navigate('/projects');
    } catch {
      toast.error('Impossible de supprimer le projet');
    }
  };

  /* ── Actions membres ── */
  const handleAddMember = async (userId) => {
    try {
      await projectsApi.addMember(id, { user_id: userId });
      toast.success('Membre ajouté à l\'équipe');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };
  const handleRemoveMember = async (userId, nom) => {
    if (!window.confirm(`Retirer ${nom} du projet ?`)) return;
    try {
      await projectsApi.removeMember(id, userId);
      toast.success(`${nom} retiré du projet`);
      load();
    } catch {
      toast.error('Impossible de retirer ce membre');
    }
  };

  /* ── Actions tâches ── */
  const handleStatusChange = async (taskId, statut) => {
    try {
      await tasksApi.updateStatus(id, taskId, statut);
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, statut } : t));
    } catch {
      toast.error('Impossible de mettre à jour le statut');
    }
  };
  const handleDeleteTask = async (taskId, titre) => {
    if (!window.confirm(`Supprimer la tâche « ${titre} » ?`)) return;
    try {
      await tasksApi.remove(id, taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast.success('Tâche supprimée');
    } catch {
      toast.error('Impossible de supprimer la tâche');
    }
  };

  /* ── Actions livrables ── */
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    const toastId = toast.loading(`Envoi de ${file.name}…`);
    try {
      const { data } = await deliverablesApi.upload(id, fd);
      setDeliverables((prev) => [data, ...prev]);
      toast.success('Fichier déposé avec succès', { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'upload', { id: toastId });
    }
    e.target.value = '';
  };
  const handleDeleteDeliverable = async (delId, nom) => {
    if (!window.confirm(`Supprimer « ${nom} » ?`)) return;
    try {
      await deliverablesApi.remove(id, delId);
      setDeliverables((prev) => prev.filter((d) => d.id !== delId));
      toast.success('Livrable supprimé');
    } catch {
      toast.error('Impossible de supprimer');
    }
  };

  /* ── Calculs ── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-gray-400">
        <svg className="animate-spin w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm">Chargement du projet…</span>
      </div>
    );
  }
  if (!project) return null;

  const doneTasks    = tasks.filter((t) => t.statut === 'done').length;
  const lateTasks    = tasks.filter((t) => t.deadline && isPast(parseISO(t.deadline)) && t.statut !== 'done').length;
  const pct          = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;
  const memberIds    = project.members.map((m) => m.id);
  const nonMembers   = allStudents.filter((s) => !memberIds.includes(s.id));
  const filteredTasks = taskFilter === 'all' ? tasks : tasks.filter((t) => t.statut === taskFilter);

  const tabCounts = {
    tasks:        tasks.length,
    deliverables: deliverables.length,
    members:      project.members.length,
  };

  return (
    <div className="space-y-6">

      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-2 text-sm text-gray-400">
        <Link to="/projects" className="hover:text-purple-600 transition-colors">Projets</Link>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-700 font-medium truncate">{project.titre}</span>
      </nav>

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">{project.titre}</h1>
          {project.description && (
            <p className="text-gray-500 mt-1.5 leading-relaxed max-w-2xl">{project.description}</p>
          )}
        </div>
        {isEncadrant && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to={`/projects/${id}/edit`} className="btn-secondary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Modifier
            </Link>
            <button onClick={handleDeleteProject} className="btn-danger">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Supprimer
            </button>
          </div>
        )}
      </div>

      {/* ── Bloc infos + progression ── */}
      <div className="grid sm:grid-cols-3 gap-4">
        {/* Progression */}
        <div className="sm:col-span-2 card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Progression globale</h3>
            <span className={`text-2xl font-bold ${pct === 100 ? 'text-green-600' : 'text-purple-700'}`}>
              {pct}%
            </span>
          </div>
          <ProgressBar value={pct} size="lg" showLabel={false} />
          <div className="flex flex-wrap gap-5 mt-4 text-sm">
            <StatBadge label="Total" value={tasks.length} color="gray" />
            <StatBadge label="Terminées" value={doneTasks} color="green" />
            <StatBadge label="En cours" value={tasks.filter((t) => t.statut === 'in_progress').length} color="blue" />
            <StatBadge label="En retard" value={lateTasks} color="red" />
          </div>
        </div>

        {/* Infos projet */}
        <div className="card space-y-3 text-sm">
          <InfoRow label="Encadrant" value={project.encadrant_nom} icon="👨‍🏫" />
          <InfoRow label="Équipe" value={`${project.members.length} membre${project.members.length > 1 ? 's' : ''}`} icon="👥" />
          {project.date_debut && (
            <InfoRow
              label="Début"
              value={format(parseISO(project.date_debut), 'dd MMM yyyy', { locale: fr })}
              icon="📅"
            />
          )}
          {project.date_fin && (
            <InfoRow
              label="Fin"
              value={format(parseISO(project.date_fin), 'dd MMM yyyy', { locale: fr })}
              icon={isPast(parseISO(project.date_fin)) && pct < 100 ? '⚠️' : '🏁'}
              alert={isPast(parseISO(project.date_fin)) && pct < 100}
            />
          )}
        </div>
      </div>

      {/* ── Onglets ── */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 -mb-px">
          {TABS.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{icon}</span>
              {label}
              <span className={`text-xs rounded-full px-1.5 py-0.5 font-semibold ${
                tab === key ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {tabCounts[key]}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* ══════════════ ONGLET TÂCHES ══════════════ */}
      {tab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Filtres statut */}
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'all',         label: 'Toutes', count: tasks.length },
                { value: 'todo',        label: 'À faire', count: tasks.filter((t) => t.statut === 'todo').length },
                { value: 'in_progress', label: 'En cours', count: tasks.filter((t) => t.statut === 'in_progress').length },
                { value: 'done',        label: 'Terminées', count: tasks.filter((t) => t.statut === 'done').length },
              ].map(({ value, label, count }) => (
                <button
                  key={value}
                  onClick={() => setTaskFilter(value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    taskFilter === value
                      ? 'bg-purple-700 text-white'
                      : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>
            <Link to={`/projects/${id}/tasks/new`} className="btn-primary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouvelle tâche
            </Link>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="card text-center py-14 text-gray-400">
              <p className="text-3xl mb-2">✅</p>
              <p className="font-medium">
                {taskFilter === 'all' ? 'Aucune tâche pour ce projet' : `Aucune tâche « ${taskFilter === 'todo' ? 'À faire' : taskFilter === 'in_progress' ? 'En cours' : 'Terminée'} »`}
              </p>
            </div>
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
          )}
        </div>
      )}

      {/* ══════════════ ONGLET LIVRABLES ══════════════ */}
      {tab === 'deliverables' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {deliverables.length} fichier{deliverables.length !== 1 ? 's' : ''} déposé{deliverables.length !== 1 ? 's' : ''}
            </p>
            <label className="btn-primary cursor-pointer">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Déposer un fichier
              <input type="file" className="hidden" onChange={handleUpload} />
            </label>
          </div>

          {deliverables.length === 0 ? (
            <div className="card text-center py-14 text-gray-400">
              <p className="text-4xl mb-3">📂</p>
              <p className="font-medium">Aucun livrable déposé</p>
              <p className="text-sm mt-1">Cliquez sur « Déposer un fichier » pour commencer</p>
            </div>
          ) : (
            <div className="card p-0 divide-y divide-gray-100">
              {deliverables.map((d) => (
                <div key={d.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                  {/* Icône selon extension */}
                  <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-base">{getFileIcon(d.nom_fichier)}</span>
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-purple-700 hover:text-purple-900 hover:underline truncate block"
                    >
                      {d.nom_fichier}
                    </a>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Déposé par <span className="font-medium">{d.uploade_par_nom}</span>
                      {' · '}
                      {format(parseISO(d.created_at), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={d.url}
                      download
                      className="text-gray-400 hover:text-gray-700 transition-colors"
                      title="Télécharger"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                    {(isEncadrant || d.uploade_par === user.id) && (
                      <button
                        onClick={() => handleDeleteDeliverable(d.id, d.nom_fichier)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
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

      {/* ══════════════ ONGLET ÉQUIPE ══════════════ */}
      {tab === 'members' && (
        <div className="space-y-5">
          {/* Membres actuels */}
          {project.members.length === 0 ? (
            <div className="card text-center py-14 text-gray-400">
              <p className="text-4xl mb-3">👥</p>
              <p className="font-medium">Aucun membre dans ce projet</p>
              {isEncadrant && <p className="text-sm mt-1">Ajoutez des étudiants ci-dessous</p>}
            </div>
          ) : (
            <div className="card p-0 divide-y divide-gray-100">
              {project.members.map((m) => (
                <div key={m.id} className="flex items-center gap-4 px-5 py-4">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {m.nom.charAt(0).toUpperCase()}
                  </div>
                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{m.nom}</p>
                    <p className="text-xs text-gray-400 truncate">{m.email}</p>
                  </div>
                  {/* Badge rôle */}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 font-medium flex-shrink-0">
                    Étudiant
                  </span>
                  {/* Retirer */}
                  {isEncadrant && (
                    <button
                      onClick={() => handleRemoveMember(m.id, m.nom)}
                      className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
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

          {/* Encadrant */}
          <div className="card flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-700 to-purple-900 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {project.encadrant_nom.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{project.encadrant_nom}</p>
              <p className="text-xs text-gray-400">Responsable du projet</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
              Encadrant
            </span>
          </div>

          {/* Ajouter des membres (encadrant only) */}
          {isEncadrant && nonMembers.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Ajouter un étudiant
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {nonMembers.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold flex-shrink-0">
                        {s.nom.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{s.nom}</p>
                        <p className="text-xs text-gray-400 truncate">{s.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddMember(s.id)}
                      className="flex-shrink-0 text-xs font-medium text-purple-600 hover:text-purple-800 border border-purple-200 hover:border-purple-400 rounded-lg px-3 py-1 transition-colors"
                    >
                      + Ajouter
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {isEncadrant && nonMembers.length === 0 && project.members.length > 0 && (
            <p className="text-center text-sm text-gray-400">
              Tous les étudiants sont déjà dans ce projet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Sous-composants ── */
function TaskCard({ task, projectId, userId, isEncadrant, onStatusChange, onDelete }) {
  const isLate = task.deadline && isPast(parseISO(task.deadline)) && task.statut !== 'done';
  const canEdit = isEncadrant || task.assigne_a === userId;

  return (
    <div className={`card p-4 flex gap-4 hover:shadow-sm transition-shadow ${isLate ? 'border-red-200 bg-red-50/30' : ''}`}>
      {/* Selector statut */}
      <div className="flex-shrink-0 pt-0.5">
        <select
          value={task.statut}
          onChange={(e) => onStatusChange(task.id, e.target.value)}
          className="text-xs rounded-lg border-gray-200 bg-transparent focus:ring-purple-500 cursor-pointer"
        >
          <option value="todo">À faire</option>
          <option value="in_progress">En cours</option>
          <option value="done">Terminé</option>
        </select>
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <Link
            to={`/projects/${projectId}/tasks/${task.id}`}
            className={`font-semibold hover:text-purple-700 transition-colors leading-tight ${
              task.statut === 'done' ? 'line-through text-gray-400' : 'text-gray-900'
            }`}
          >
            {task.titre}
          </Link>
          <TaskStatusBadge statut={task.statut} />
        </div>

        {task.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{task.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
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
            <span className={`flex items-center gap-1 ${isLate ? 'text-red-500 font-semibold' : ''}`}>
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
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <Link
            to={`/projects/${projectId}/tasks/${task.id}/edit`}
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            Modifier
          </Link>
          <button
            onClick={() => onDelete(task.id, task.titre)}
            className="text-xs text-gray-300 hover:text-red-500 transition-colors"
          >
            Supprimer
          </button>
          <Link
            to={`/projects/${projectId}/tasks/${task.id}`}
            className="text-xs text-purple-400 hover:text-purple-700 transition-colors mt-1"
          >
            Commentaires →
          </Link>
        </div>
      )}
    </div>
  );
}

function StatBadge({ label, value, color }) {
  const colors = {
    gray:  'text-gray-600 bg-gray-100',
    green: 'text-green-700 bg-green-100',
    blue:  'text-blue-700 bg-blue-100',
    red:   'text-red-700 bg-red-100',
  };
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${colors[color]}`}>
      <span className="font-bold">{value}</span>
      <span className="text-xs">{label}</span>
    </div>
  );
}

function InfoRow({ label, value, icon, alert }) {
  return (
    <div className="flex items-center gap-2">
      <span>{icon}</span>
      <div>
        <span className="text-gray-400 text-xs">{label}</span>
        <p className={`font-medium ${alert ? 'text-red-600' : 'text-gray-800'}`}>{value}</p>
      </div>
    </div>
  );
}

function getFileIcon(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  const map = {
    pdf:  '📄', doc: '📝', docx: '📝',
    xls:  '📊', xlsx: '📊', csv: '📊',
    ppt:  '📑', pptx: '📑',
    zip:  '🗜️', rar: '🗜️', '7z': '🗜️',
    jpg:  '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', svg: '🖼️',
    mp4:  '🎬', avi: '🎬', mov: '🎬',
    mp3:  '🎵', wav: '🎵',
    txt:  '📃',
  };
  return map[ext] || '📎';
}
