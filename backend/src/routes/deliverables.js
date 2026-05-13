const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const db      = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });
router.use(authenticate);

// ── Multer config ─────────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../../', process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    // Refuse les exécutables
    const forbidden = ['.exe', '.bat', '.sh', '.cmd'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (forbidden.includes(ext)) {
      return cb(new Error('Type de fichier non autorisé'));
    }
    cb(null, true);
  },
});

// ── helper accès projet ───────────────────────────────────────────────────────
async function canAccess(projectId, user) {
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

// ── GET /api/projects/:projectId/deliverables ─────────────────────────────────
router.get('/', async (req, res) => {
  const { projectId } = req.params;
  try {
    if (!(await canAccess(projectId, req.user))) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const { rows } = await db.query(
      `SELECT d.*, u.nom AS uploade_par_nom
       FROM deliverables d
       LEFT JOIN users u ON u.id = d.uploade_par
       WHERE d.project_id = $1
       ORDER BY d.created_at DESC`,
      [projectId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ── POST /api/projects/:projectId/deliverables ────────────────────────────────
router.post('/', upload.single('file'), async (req, res) => {
  const { projectId } = req.params;
  if (!req.file) return res.status(400).json({ message: 'Fichier requis' });

  try {
    if (!(await canAccess(projectId, req.user))) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const url = `/uploads/${req.file.filename}`;
    const { rows } = await db.query(
      `INSERT INTO deliverables (project_id, nom_fichier, url, uploade_par)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [projectId, req.file.originalname, url, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (req.file?.path) fs.unlinkSync(req.file.path);
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ── DELETE /api/projects/:projectId/deliverables/:id ─────────────────────────
router.delete('/:id', async (req, res) => {
  const { projectId, id } = req.params;
  try {
    if (!(await canAccess(projectId, req.user))) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const { rows } = await db.query(
      'DELETE FROM deliverables WHERE id=$1 AND project_id=$2 RETURNING *',
      [id, projectId]
    );
    if (!rows.length) return res.status(404).json({ message: 'Livrable introuvable' });

    // Supprimer le fichier physique
    const filePath = path.join(__dirname, '../../', rows[0].url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ message: 'Livrable supprimé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
