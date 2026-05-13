const express = require('express');
const db      = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/users?role=etudiant  — utile pour l'encadrant (ajouter membres)
router.get('/', requireRole('encadrant'), async (req, res) => {
  try {
    const { role } = req.query;
    let query = 'SELECT id, nom, email, role FROM users';
    const params = [];
    if (role) {
      params.push(role);
      query += ' WHERE role = $1';
    }
    query += ' ORDER BY nom ASC';
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
