const express = require('express');
const { body, validationResult } = require('express-validator');
const db      = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// ── helpers ──────────────────────────────────────────────────────────────────

async function isMemberOrEncadrant(projectId, user) {
  if (user.role === 'encadrant') return true;
  const { rows } = await db.query(
    'SELECT 1 FROM project_members WHERE project_id=$1 AND user_id=$2',
    [projectId, user.id]
  );
  return rows.length > 0;
}

async function isProjectEncadrant(projectId, userId) {
  const { rows } = await db.query(
    'SELECT 1 FROM projects WHERE id=$1 AND encadrant_id=$2',
    [projectId, userId]
  );
  return rows.length > 0;
}

// ── GET /api/projects ─────────────────────────────────────────────────────────
// Encadrant : tous les projets qu'il supervise
// Étudiant  : projets où il est membre
router.get('/', async (req, res) => {
  try {
    let query, params;
    if (req.user.role === 'encadrant') {
      query = `
        SELECT p.*,
               u.nom AS encadrant_nom,
               COUNT(DISTINCT pm.user_id)                               AS nb_membres,
               COUNT(DISTINCT t.id)                                     AS nb_tasks,
               COUNT(DISTINCT t.id) FILTER (WHERE t.statut = 'done')   AS nb_done,
               COUNT(DISTINCT t.id) FILTER (WHERE t.deadline < NOW() AND t.statut <> 'done') AS nb_retard
        FROM projects p
        JOIN users u ON u.id = p.encadrant_id
        LEFT JOIN project_members pm ON pm.project_id = p.id
        LEFT JOIN tasks t ON t.project_id = p.id
        WHERE p.encadrant_id = $1
        GROUP BY p.id, u.nom
        ORDER BY p.created_at DESC`;
      params = [req.user.id];
    } else {
      query = `
        SELECT p.*,
               u.nom AS encadrant_nom,
               COUNT(DISTINCT t.id)                                     AS nb_tasks,
               COUNT(DISTINCT t.id) FILTER (WHERE t.statut = 'done')   AS nb_done
        FROM projects p
        JOIN users u ON u.id = p.encadrant_id
        JOIN project_members pm ON pm.project_id = p.id
        LEFT JOIN tasks t ON t.project_id = p.id
        WHERE pm.user_id = $1
        GROUP BY p.id, u.nom
        ORDER BY p.created_at DESC`;
      params = [req.user.id];
    }
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ── GET /api/projects/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (!(await isMemberOrEncadrant(id, req.user))) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const { rows } = await db.query(
      `SELECT p.*, u.nom AS encadrant_nom
       FROM projects p
       JOIN users u ON u.id = p.encadrant_id
       WHERE p.id = $1`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Projet introuvable' });

    const { rows: members } = await db.query(
      `SELECT u.id, u.nom, u.email, u.role
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = $1`,
      [id]
    );

    res.json({ ...rows[0], members });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ── POST /api/projects ────────────────────────────────────────────────────────
router.post(
  '/',
  requireRole('encadrant'),
  [
    body('titre').trim().notEmpty(),
    body('date_debut').optional().isDate(),
    body('date_fin').optional().isDate(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { titre, description, date_debut, date_fin } = req.body;
    try {
      const { rows } = await db.query(
        `INSERT INTO projects (titre, description, date_debut, date_fin, encadrant_id)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [titre, description || null, date_debut || null, date_fin || null, req.user.id]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
);

// ── PUT /api/projects/:id ─────────────────────────────────────────────────────
router.put('/:id', requireRole('encadrant'), async (req, res) => {
  const { id } = req.params;
  try {
    if (!(await isProjectEncadrant(id, req.user.id))) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const { titre, description, date_debut, date_fin } = req.body;
    const { rows } = await db.query(
      `UPDATE projects
       SET titre=$1, description=$2, date_debut=$3, date_fin=$4
       WHERE id=$5 RETURNING *`,
      [titre, description || null, date_debut || null, date_fin || null, id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Projet introuvable' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ── DELETE /api/projects/:id ──────────────────────────────────────────────────
router.delete('/:id', requireRole('encadrant'), async (req, res) => {
  const { id } = req.params;
  try {
    if (!(await isProjectEncadrant(id, req.user.id))) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    const { rows } = await db.query('DELETE FROM projects WHERE id=$1 RETURNING id', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Projet introuvable' });
    res.json({ message: 'Projet supprimé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ── POST /api/projects/:id/members ────────────────────────────────────────────
router.post('/:id/members', requireRole('encadrant'), async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  if (!user_id) return res.status(400).json({ message: 'user_id requis' });

  try {
    if (!(await isProjectEncadrant(id, req.user.id))) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const userCheck = await db.query(
      "SELECT id FROM users WHERE id=$1 AND role='etudiant'",
      [user_id]
    );
    if (!userCheck.rows.length) {
      return res.status(404).json({ message: 'Étudiant introuvable' });
    }

    await db.query(
      'INSERT INTO project_members (project_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [id, user_id]
    );
    res.status(201).json({ message: 'Membre ajouté' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ── DELETE /api/projects/:id/members/:userId ──────────────────────────────────
router.delete('/:id/members/:userId', requireRole('encadrant'), async (req, res) => {
  const { id, userId } = req.params;
  try {
    if (!(await isProjectEncadrant(id, req.user.id))) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    await db.query(
      'DELETE FROM project_members WHERE project_id=$1 AND user_id=$2',
      [id, userId]
    );
    res.json({ message: 'Membre retiré' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ── GET /api/projects/dashboard (encadrant) ───────────────────────────────────
router.get('/stats/dashboard', requireRole('encadrant'), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT
         p.id, p.titre, p.date_fin,
         COUNT(DISTINCT pm.user_id)                                      AS nb_membres,
         COUNT(DISTINCT t.id)                                            AS nb_tasks,
         COUNT(DISTINCT t.id) FILTER (WHERE t.statut = 'done')          AS nb_done,
         COUNT(DISTINCT t.id) FILTER (WHERE t.statut = 'in_progress')   AS nb_progress,
         COUNT(DISTINCT t.id) FILTER (WHERE t.deadline < NOW() AND t.statut <> 'done') AS nb_retard,
         CASE WHEN COUNT(DISTINCT t.id) = 0 THEN 0
              ELSE ROUND(COUNT(DISTINCT t.id) FILTER (WHERE t.statut = 'done') * 100.0
                         / COUNT(DISTINCT t.id))
         END AS progression
       FROM projects p
       LEFT JOIN project_members pm ON pm.project_id = p.id
       LEFT JOIN tasks t ON t.project_id = p.id
       WHERE p.encadrant_id = $1
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
