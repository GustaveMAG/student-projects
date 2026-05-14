const express = require('express');
const { body, validationResult } = require('express-validator');
const db      = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { sendTaskAssigned } = require('../services/emailService');

// ── helper : envoie l'email à l'assigné ──────────────────────────────────────
async function notifyAssignee({ taskId, taskTitle, projectId, deadline, assignedBy, assigneeId }) {
  try {
    // Récupère email + nom de l'assigné
    const { rows: userRows } = await db.query(
      'SELECT nom, email FROM users WHERE id = $1',
      [assigneeId]
    );
    if (!userRows.length) return;

    // Récupère le nom du projet
    const { rows: projRows } = await db.query(
      'SELECT nom FROM projects WHERE id = $1',
      [projectId]
    );
    const projectName = projRows.length ? projRows[0].nom : 'Projet';

    await sendTaskAssigned({
      to:          userRows[0].email,
      studentName: userRows[0].nom,
      taskTitle,
      taskId,
      projectName,
      projectId,
      deadline,
      assignedBy,
    });
  } catch (err) {
    console.error('[notifyAssignee]', err.message);
  }
}

const router = express.Router({ mergeParams: true }); // hérite projectId
router.use(authenticate);

// ── helper : vérifie accès au projet ─────────────────────────────────────────
async function canAccessProject(projectId, user) {
  if (user.role === 'encadrant') {
    const { rows } = await db.query(
      'SELECT 1 FROM projects WHERE id=$1 AND encadrant_id=$2',
      [projectId, user.id]
    );
    return rows.length > 0;
  }
  const { rows } = await db.query(
    'SELECT 1 FROM project_members WHERE project_id=$1 AND user_id=$2',
    [projectId, user.id]
  );
  return rows.length > 0;
}

// ── GET /api/projects/:projectId/tasks ────────────────────────────────────────
router.get('/', async (req, res) => {
  const { projectId } = req.params;
  try {
    if (!(await canAccessProject(projectId, req.user))) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const { statut, assigne_a } = req.query;
    let query = `
      SELECT t.*, u.nom AS assignee_nom
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assigne_a
      WHERE t.project_id = $1`;
    const params = [projectId];

    if (statut) {
      params.push(statut);
      query += ` AND t.statut = $${params.length}`;
    }
    if (assigne_a) {
      params.push(assigne_a);
      query += ` AND t.assigne_a = $${params.length}`;
    }
    query += ' ORDER BY t.deadline ASC NULLS LAST, t.created_at ASC';

    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ── GET /api/projects/:projectId/tasks/:id ────────────────────────────────────
router.get('/:id', async (req, res) => {
  const { projectId, id } = req.params;
  try {
    if (!(await canAccessProject(projectId, req.user))) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const { rows } = await db.query(
      `SELECT t.*, u.nom AS assignee_nom
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assigne_a
       WHERE t.id = $1 AND t.project_id = $2`,
      [id, projectId]
    );
    if (!rows.length) return res.status(404).json({ message: 'Tâche introuvable' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ── POST /api/projects/:projectId/tasks ───────────────────────────────────────
router.post(
  '/',
  [
    body('titre').trim().notEmpty().withMessage('Titre requis'),
    body('statut').optional().isIn(['todo', 'in_progress', 'done']),
    body('deadline').optional({ nullable: true }).isDate(),
    body('assigne_a').optional({ nullable: true }).isInt(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { projectId } = req.params;
    try {
      if (!(await canAccessProject(projectId, req.user))) {
        return res.status(403).json({ message: 'Accès refusé' });
      }

      const { titre, description, statut, assigne_a, deadline } = req.body;
      const { rows } = await db.query(
        `INSERT INTO tasks (project_id, titre, description, statut, assigne_a, deadline)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [
          projectId,
          titre,
          description || null,
          statut || 'todo',
          assigne_a || null,
          deadline || null,
        ]
      );
      const task = rows[0];
      res.status(201).json(task);

      // ── Email de notification (non bloquant) ──
      if (assigne_a) {
        notifyAssignee({
          taskId:    task.id,
          taskTitle: titre,
          projectId,
          deadline,
          assignedBy: req.user.nom,
          assigneeId: assigne_a,
        }).catch(console.error);
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
);

// ── PUT /api/projects/:projectId/tasks/:id ────────────────────────────────────
router.put('/:id', async (req, res) => {
  const { projectId, id } = req.params;
  try {
    if (!(await canAccessProject(projectId, req.user))) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const { titre, description, statut, assigne_a, deadline } = req.body;
    const { rows } = await db.query(
      `UPDATE tasks
       SET titre=$1, description=$2, statut=$3, assigne_a=$4, deadline=$5
       WHERE id=$6 AND project_id=$7
       RETURNING *`,
      [
        titre,
        description || null,
        statut,
        assigne_a || null,
        deadline || null,
        id,
        projectId,
      ]
    );
    if (!rows.length) return res.status(404).json({ message: 'Tâche introuvable' });
    const task = rows[0];
    res.json(task);

    // ── Email si l'assigné a changé ──
    if (assigne_a && String(assigne_a) !== String(task.assigne_a)) {
      notifyAssignee({
        taskId:    task.id,
        taskTitle: titre,
        projectId,
        deadline,
        assignedBy: req.user.nom,
        assigneeId: assigne_a,
      }).catch(console.error);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ── PATCH /api/projects/:projectId/tasks/:id/status ───────────────────────────
// Mise à jour rapide du statut uniquement
router.patch('/:id/status', async (req, res) => {
  const { projectId, id } = req.params;
  const { statut } = req.body;

  if (!['todo', 'in_progress', 'done'].includes(statut)) {
    return res.status(400).json({ message: 'Statut invalide' });
  }

  try {
    if (!(await canAccessProject(projectId, req.user))) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const { rows } = await db.query(
      'UPDATE tasks SET statut=$1 WHERE id=$2 AND project_id=$3 RETURNING *',
      [statut, id, projectId]
    );
    if (!rows.length) return res.status(404).json({ message: 'Tâche introuvable' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ── DELETE /api/projects/:projectId/tasks/:id ─────────────────────────────────
router.delete('/:id', async (req, res) => {
  const { projectId, id } = req.params;
  try {
    if (!(await canAccessProject(projectId, req.user))) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const { rows } = await db.query(
      'DELETE FROM tasks WHERE id=$1 AND project_id=$2 RETURNING id',
      [id, projectId]
    );
    if (!rows.length) return res.status(404).json({ message: 'Tâche introuvable' });
    res.json({ message: 'Tâche supprimée' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
