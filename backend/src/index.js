require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const path     = require('path');

const authRoutes         = require('./routes/auth');
const projectRoutes      = require('./routes/projects');
const taskRoutes         = require('./routes/tasks');
const deliverableRoutes  = require('./routes/deliverables');
const commentRoutes      = require('./routes/comments');
const userRoutes         = require('./routes/users');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middlewares globaux ───────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'https://student-projects-nine.vercel.app',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origin (Postman, mobile, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers uploadés
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/users',    userRoutes);
app.use('/api/projects', projectRoutes);

// Routes imbriquées : tâches & livrables sous /projects/:projectId
app.use('/api/projects/:projectId/tasks',        taskRoutes);
app.use('/api/projects/:projectId/deliverables', deliverableRoutes);

// Commentaires sous /tasks/:taskId
app.use('/api/tasks/:taskId/comments', commentRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ── Gestion d'erreurs globale ─────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'Fichier trop volumineux' });
  }
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Erreur serveur' });
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
