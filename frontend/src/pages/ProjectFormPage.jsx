import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { projectsApi } from '../lib/api';
import toast from 'react-hot-toast';

export default function ProjectFormPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const isEdit   = Boolean(id);

  const [form, setForm] = useState({
    titre: '', description: '', date_debut: '', date_fin: '',
  });
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    projectsApi.get(id)
      .then(({ data }) => setForm({
        titre:       data.titre       || '',
        description: data.description || '',
        date_debut:  data.date_debut  ? data.date_debut.slice(0, 10) : '',
        date_fin:    data.date_fin    ? data.date_fin.slice(0, 10)   : '',
      }))
      .catch(() => toast.error('Projet introuvable'))
      .finally(() => setFetching(false));
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await projectsApi.update(id, form);
        toast.success('Projet mis à jour');
        navigate(`/projects/${id}`);
      } else {
        const { data } = await projectsApi.create(form);
        toast.success('Projet créé');
        navigate(`/projects/${data.id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center py-20 text-primary-muted text-sm">
        Chargement…
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-lg mx-auto space-y-5">

        {/* Header */}
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-primary-muted mb-3">
            <Link to="/projects" className="hover:text-primary transition-colors">Projets</Link>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-primary">{isEdit ? 'Modifier' : 'Nouveau projet'}</span>
          </nav>
          <h1 className="text-base font-semibold text-primary">
            {isEdit ? 'Modifier le projet' : 'Nouveau projet'}
          </h1>
        </div>

        <div className="bg-surface border border-border rounded-lg p-5">
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="label">Titre *</label>
              <input
                type="text"
                className="input"
                placeholder="Nom du projet"
                value={form.titre}
                onChange={(e) => setForm({ ...form, titre: e.target.value })}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="label">Description</label>
              <textarea
                className="input resize-none"
                rows={4}
                placeholder="Décrivez le projet…"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Date de début</label>
                <input
                  type="date"
                  className="input"
                  value={form.date_debut}
                  onChange={(e) => setForm({ ...form, date_debut: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Date de fin</label>
                <input
                  type="date"
                  className="input"
                  value={form.date_fin}
                  onChange={(e) => setForm({ ...form, date_fin: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (isEdit ? 'Mettre à jour' : 'Créer le projet')}
              </button>
              <Link to={isEdit ? `/projects/${id}` : '/projects'} className="btn-ghost">
                Annuler
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
