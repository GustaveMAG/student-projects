import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { tasksApi, projectsApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_OPTIONS = [
  { value: 'todo',        label: 'À faire',  cls: 'badge-todo' },
  { value: 'in_progress', label: 'En cours', cls: 'badge-progress' },
  { value: 'done',        label: 'Terminé',  cls: 'badge-done' },
];

export default function TaskFormPage() {
  const { projectId, id } = useParams();
  const navigate          = useNavigate();
  const { user }          = useAuth();
  const isEdit            = Boolean(id);

  const [form, setForm] = useState({
    titre: '', description: '', statut: 'todo', assigne_a: '', deadline: '',
  });
  const [members, setMembers]   = useState([]);
  const [project, setProject]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors]     = useState({});

  useEffect(() => {
    const init = async () => {
      try {
        const { data: proj } = await projectsApi.get(projectId);
        setProject(proj);
        setMembers(proj.members || []);

        if (isEdit) {
          const { data: task } = await tasksApi.get(projectId, id);
          setForm({
            titre:       task.titre       || '',
            description: task.description || '',
            statut:      task.statut      || 'todo',
            assigne_a:   task.assigne_a   ? String(task.assigne_a) : '',
            deadline:    task.deadline    ? task.deadline.slice(0, 10) : '',
          });
        }
      } catch {
        toast.error('Impossible de charger les données');
        navigate(`/projects/${projectId}`);
      } finally {
        setFetching(false);
      }
    };
    init();
  }, [projectId, id, isEdit, navigate]);

  const validate = () => {
    const e = {};
    if (!form.titre.trim()) e.titre = 'Le titre est requis';
    if (form.deadline && isNaN(Date.parse(form.deadline))) e.deadline = 'Date invalide';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    const payload = { ...form, assigne_a: form.assigne_a || null, deadline: form.deadline || null };
    try {
      if (isEdit) {
        await tasksApi.update(projectId, id, payload);
        toast.success('Tâche mise à jour');
      } else {
        await tasksApi.create(projectId, payload);
        toast.success('Tâche créée');
      }
      navigate(`/projects/${projectId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  };

  if (fetching) {
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

  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-lg mx-auto space-y-5">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-primary-muted">
          <Link to="/projects" className="hover:text-primary transition-colors">Projets</Link>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link to={`/projects/${projectId}`} className="hover:text-primary transition-colors truncate max-w-[120px]">
            {project?.titre || 'Projet'}
          </Link>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-primary">{isEdit ? 'Modifier' : 'Nouvelle tâche'}</span>
        </nav>

        <h1 className="text-base font-semibold text-primary">
          {isEdit ? 'Modifier la tâche' : 'Nouvelle tâche'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* General info */}
          <div className="bg-surface border border-border rounded-lg p-4 space-y-4">
            <p className="label">Informations générales</p>

            <div>
              <label className="label">Titre *</label>
              <input
                type="text"
                className={`input ${errors.titre ? 'border-danger/60' : ''}`}
                placeholder="Ex : Réaliser la maquette Figma"
                value={form.titre}
                onChange={(e) => setField('titre', e.target.value)}
                autoFocus
              />
              {errors.titre && <p className="text-xs text-danger mt-1">{errors.titre}</p>}
            </div>

            <div>
              <label className="label">Description</label>
              <textarea
                className="input resize-none leading-relaxed"
                rows={4}
                placeholder="Décrivez le travail attendu…"
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
              />
              <p className="text-[10px] text-primary-muted mt-1 text-right">
                {form.description.length} caractère{form.description.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Planning */}
          <div className="bg-surface border border-border rounded-lg p-4 space-y-4">
            <p className="label">Planification</p>

            {/* Status */}
            <div>
              <label className="label">Statut</label>
              <div className="grid grid-cols-3 gap-2">
                {STATUS_OPTIONS.map(({ value, label, cls }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setField('statut', value)}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium transition-all ${
                      form.statut === value
                        ? 'border-accent/40 bg-accent-soft text-accent'
                        : 'border-border text-primary-muted hover:border-border-2 hover:text-primary'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      value === 'todo' ? 'bg-primary-muted'
                      : value === 'in_progress' ? 'bg-accent'
                      : 'bg-success'
                    }`} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Deadline */}
            <div>
              <label className="label">
                Deadline
                {form.deadline && form.deadline < today && (
                  <span className="ml-2 text-[10px] font-normal text-danger normal-case">⚠ Date dans le passé</span>
                )}
              </label>
              <input
                type="date"
                className={`input ${errors.deadline ? 'border-danger/60' : ''}`}
                value={form.deadline}
                onChange={(e) => setField('deadline', e.target.value)}
              />
              {form.deadline && (
                <button
                  type="button"
                  onClick={() => setField('deadline', '')}
                  className="text-[10px] text-primary-muted hover:text-danger mt-1 transition-colors"
                >
                  × Supprimer la deadline
                </button>
              )}
            </div>
          </div>

          {/* Assignee */}
          <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
            <p className="label">Responsable</p>

            {members.length === 0 ? (
              <p className="text-xs text-primary-muted bg-surface-2 rounded-lg px-4 py-3">
                Aucun membre dans ce projet.
              </p>
            ) : (
              <div className="space-y-1.5">
                {/* Unassigned option */}
                <label className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-all ${
                  !form.assigne_a ? 'border-accent/40 bg-accent-soft' : 'border-border hover:border-border-2'
                }`}>
                  <input
                    type="radio"
                    name="assignee"
                    value=""
                    checked={!form.assigne_a}
                    onChange={() => setField('assigne_a', '')}
                    className="accent-accent"
                  />
                  <div className="w-6 h-6 rounded-full bg-surface-2 border border-border flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-primary-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className={`text-sm ${!form.assigne_a ? 'text-accent font-medium' : 'text-primary-muted'}`}>
                    Non assigné
                  </span>
                </label>

                {members.map((m) => (
                  <label
                    key={m.id}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-all ${
                      form.assigne_a === String(m.id)
                        ? 'border-accent/40 bg-accent-soft'
                        : 'border-border hover:border-border-2'
                    }`}
                  >
                    <input
                      type="radio"
                      name="assignee"
                      value={m.id}
                      checked={form.assigne_a === String(m.id)}
                      onChange={() => setField('assigne_a', String(m.id))}
                      className="accent-accent"
                    />
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0"
                      style={{ background: `hsl(${m.nom.charCodeAt(0) * 5 % 360}deg 50% 45%)` }}
                    >
                      {m.nom.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${form.assigne_a === String(m.id) ? 'text-accent font-medium' : 'text-primary'}`}>
                        {m.nom}
                      </p>
                      <p className="text-[10px] text-primary-muted truncate">{m.email}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pb-4">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {isEdit ? 'Mettre à jour' : 'Créer la tâche'}
                </>
              )}
            </button>

            <Link to={`/projects/${projectId}`} className="btn-ghost">
              Annuler
            </Link>

            {isEdit && user.role === 'encadrant' && (
              <button
                type="button"
                onClick={async () => {
                  if (!window.confirm('Supprimer cette tâche ?')) return;
                  try {
                    await tasksApi.remove(projectId, id);
                    toast.success('Tâche supprimée');
                    navigate(`/projects/${projectId}`);
                  } catch { toast.error('Impossible de supprimer'); }
                }}
                className="btn-danger ml-auto"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Supprimer
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
