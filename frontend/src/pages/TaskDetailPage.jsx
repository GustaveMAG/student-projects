import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { tasksApi, commentsApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format, isPast, parseISO, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function TaskDetailPage() {
  const { projectId, id } = useParams();
  const { user }          = useAuth();
  const navigate          = useNavigate();

  const [task, setTask]             = useState(null);
  const [comments, setComments]     = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading]       = useState(true);
  const [sending, setSending]       = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    Promise.all([tasksApi.get(projectId, id), commentsApi.list(id)])
      .then(([tRes, cRes]) => {
        setTask(tRes.data);
        setComments(cRes.data);
      })
      .catch(() => {
        toast.error('Tâche introuvable');
        navigate(`/projects/${projectId}`);
      })
      .finally(() => setLoading(false));
  }, [projectId, id, navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleStatusChange = async (statut) => {
    try {
      await tasksApi.updateStatus(projectId, id, statut);
      setTask((t) => ({ ...t, statut }));
      toast.success('Statut mis à jour');
    } catch {
      toast.error('Impossible de mettre à jour');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSending(true);
    try {
      const { data } = await commentsApi.create(id, { contenu: newComment.trim() });
      setComments((prev) => [...prev, data]);
      setNewComment('');
      inputRef.current?.focus();
    } catch {
      toast.error("Impossible d'envoyer le commentaire");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await commentsApi.remove(id, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      toast.error('Impossible de supprimer');
    }
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
  if (!task) return null;

  const isLate = task.deadline && isPast(parseISO(task.deadline)) && task.statut !== 'done';
  const isDone = task.statut === 'done';

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-1.5 text-xs text-primary-muted">
          <Link to="/projects" className="hover:text-primary transition-colors">Projets</Link>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link to={`/projects/${projectId}`} className="hover:text-primary transition-colors">Projet</Link>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-primary truncate">{task.titre}</span>
        </nav>

        {/* ── Task card ── */}
        <div className={`bg-surface border rounded-lg p-5 space-y-4 ${isLate ? 'border-danger/30' : 'border-border'}`}>

          {/* Late banner */}
          {isLate && (
            <div className="flex items-center gap-2 text-xs font-medium text-danger bg-danger/10 -mx-5 -mt-5 px-5 py-2.5 rounded-t-lg border-b border-danger/20">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Cette tâche est en retard — deadline dépassée
            </div>
          )}

          {/* Title + status */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <h1 className={`text-base font-semibold flex-1 leading-snug ${isDone ? 'line-through text-primary-muted' : 'text-primary'}`}>
              {task.titre}
            </h1>
            <StatusBadge statut={task.statut} />
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-sm text-primary-muted leading-relaxed whitespace-pre-wrap bg-surface-2 rounded-lg px-4 py-3">
              {task.description}
            </p>
          )}

          {/* Meta grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetaCard label="Assigné à" value={task.assignee_nom || 'Non assigné'} />
            <MetaCard
              label="Deadline"
              value={task.deadline ? format(parseISO(task.deadline), 'dd MMM yyyy', { locale: fr }) : '—'}
              alert={isLate}
            />
            <MetaCard label="Créée le" value={format(parseISO(task.created_at), 'dd MMM yyyy', { locale: fr })} />
            <MetaCard label="Commentaires" value={comments.length} />
          </div>

          {/* Change status */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border">
            <span className="text-xs text-primary-muted">Statut :</span>
            <div className="flex gap-1.5">
              {[
                { value: 'todo',        label: 'À faire' },
                { value: 'in_progress', label: 'En cours' },
                { value: 'done',        label: 'Terminé' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleStatusChange(value)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                    task.statut === value
                      ? 'bg-accent text-white border-accent'
                      : 'border-border text-primary-muted hover:text-primary hover:border-border-2'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <Link
              to={`/projects/${projectId}/tasks/${id}/edit`}
              className="ml-auto btn-ghost text-xs py-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Modifier
            </Link>
          </div>
        </div>

        {/* ── Comments ── */}
        <div className="bg-surface border border-border rounded-lg p-5 space-y-4">
          <h2 className="text-sm font-semibold text-primary flex items-center gap-2">
            <svg className="w-4 h-4 text-primary-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Discussion
            <span className="text-xs font-normal text-primary-muted">({comments.length})</span>
          </h2>

          {/* Comments list */}
          <div className={`space-y-1 ${comments.length > 5 ? 'max-h-[400px] overflow-y-auto pr-1' : ''}`}>
            {comments.length === 0 && (
              <div className="text-center py-10 text-primary-muted">
                <svg className="w-8 h-8 mx-auto mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-xs">Aucun commentaire — soyez le premier</p>
              </div>
            )}

            {comments.map((c, idx) => {
              const isMine   = c.user_id === user.id;
              const prevSame = idx > 0 && comments[idx - 1].user_id === c.user_id;

              return (
                <div
                  key={c.id}
                  className={`flex gap-2.5 ${isMine ? 'flex-row-reverse' : ''} ${prevSame ? 'mt-1' : 'mt-3'}`}
                >
                  <div className="w-7 flex-shrink-0">
                    {!prevSame && (
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold ${
                        isMine ? 'bg-accent text-white' : 'bg-surface-2 text-primary-muted border border-border'
                      }`}>
                        {c.auteur_nom?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className={`flex flex-col gap-0.5 max-w-[75%] ${isMine ? 'items-end' : 'items-start'}`}>
                    {!prevSame && (
                      <span className="text-[11px] text-primary-muted px-1">
                        {isMine ? 'Vous' : c.auteur_nom}
                        {' · '}
                        {formatDistanceToNow(parseISO(c.created_at), { addSuffix: true, locale: fr })}
                      </span>
                    )}

                    <div className={`group relative rounded-xl px-3.5 py-2 text-sm leading-relaxed ${
                      isMine
                        ? 'bg-accent text-white rounded-tr-sm'
                        : 'bg-surface-2 text-primary rounded-tl-sm border border-border'
                    }`}>
                      {c.contenu}

                      {(isMine || user.role === 'encadrant') && (
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className={`absolute -top-2 ${isMine ? '-left-2' : '-right-2'} w-4 h-4 rounded-full bg-danger text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity`}
                          title="Supprimer"
                        >
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="flex gap-2 pt-3 border-t border-border">
            <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0 self-end mb-0.5">
              {user.nom?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                rows={1}
                className="input resize-none pr-10 py-2 text-sm leading-relaxed"
                placeholder="Écrire un commentaire… (Entrée pour envoyer)"
                value={newComment}
                onChange={(e) => {
                  setNewComment(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !newComment.trim()}
                className="absolute right-2 bottom-2 w-6 h-6 rounded-md bg-accent text-white flex items-center justify-center hover:bg-accent-hover transition-colors disabled:opacity-30"
              >
                {sending ? (
                  <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </form>
          <p className="text-[10px] text-primary-muted text-right -mt-2">Maj+Entrée pour sauter une ligne</p>
        </div>
      </div>
    </div>
  );
}

/* ── Status badge ── */
function StatusBadge({ statut }) {
  const map = {
    todo:        'badge-todo',
    in_progress: 'badge-progress',
    done:        'badge-done',
  };
  const labels = { todo: 'À faire', in_progress: 'En cours', done: 'Terminé' };
  return <span className={map[statut] || 'badge-todo'}>{labels[statut] || statut}</span>;
}

/* ── Meta card ── */
function MetaCard({ label, value, alert }) {
  return (
    <div className={`rounded-lg p-3 ${alert ? 'bg-danger/10 border border-danger/20' : 'bg-surface-2'}`}>
      <p className={`label mb-1 ${alert ? 'text-danger/70' : ''}`}>{label}</p>
      <p className={`text-sm font-medium ${alert ? 'text-danger' : 'text-primary'}`}>
        {alert && '⚠ '}{value}
      </p>
    </div>
  );
}
