# Plateforme de gestion de projets étudiants

Stack : **React + Tailwind CSS** / **Node.js + Express** / **PostgreSQL** / **JWT**

---

## Structure du projet

```
student-projects/
├── database/
│   └── schema.sql              ← Schéma PostgreSQL complet
├── backend/
│   ├── src/
│   │   ├── config/db.js        ← Pool PostgreSQL
│   │   ├── middleware/auth.js  ← JWT + contrôle des rôles
│   │   ├── routes/
│   │   │   ├── auth.js         ← /api/auth/*
│   │   │   ├── projects.js     ← /api/projects/*
│   │   │   ├── tasks.js        ← /api/projects/:id/tasks/*
│   │   │   ├── deliverables.js ← /api/projects/:id/deliverables/*
│   │   │   ├── comments.js     ← /api/tasks/:id/comments/*
│   │   │   └── users.js        ← /api/users
│   │   └── index.js            ← Point d'entrée Express
│   ├── uploads/                ← Fichiers uploadés (auto-créé)
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── contexts/AuthContext.jsx
    │   ├── lib/api.js           ← Toutes les fonctions axios
    │   ├── components/
    │   │   ├── Layout.jsx
    │   │   ├── ProgressBar.jsx
    │   │   └── TaskStatusBadge.jsx
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── DashboardPage.jsx    ← Encadrant uniquement
    │   │   ├── ProjectsPage.jsx
    │   │   ├── ProjectDetailPage.jsx ← Tâches + Livrables + Équipe
    │   │   ├── ProjectFormPage.jsx
    │   │   ├── TaskFormPage.jsx
    │   │   └── TaskDetailPage.jsx   ← + Commentaires
    │   ├── App.jsx              ← Routing complet
    │   └── index.js
    ├── tailwind.config.js
    ├── postcss.config.js
    └── package.json
```

---

## Installation

### 1. Base de données

```bash
# Créer la base
createdb student_projects

# Appliquer le schéma
psql student_projects < database/schema.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Éditer .env : DATABASE_URL, JWT_SECRET
npm install
npm run dev       # démarre sur http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
npm install
npm start         # démarre sur http://localhost:3000
```

---

## Routes API

| Méthode | Endpoint | Rôle | Description |
|---------|----------|------|-------------|
| POST | `/api/auth/register` | tous | Créer un compte |
| POST | `/api/auth/login` | tous | Connexion |
| GET  | `/api/auth/me` | auth | Profil courant |
| GET  | `/api/projects` | auth | Liste des projets |
| POST | `/api/projects` | encadrant | Créer un projet |
| GET  | `/api/projects/stats/dashboard` | encadrant | KPIs tableau de bord |
| GET  | `/api/projects/:id` | auth | Détail + membres |
| PUT  | `/api/projects/:id` | encadrant | Modifier |
| DELETE | `/api/projects/:id` | encadrant | Supprimer |
| POST | `/api/projects/:id/members` | encadrant | Ajouter un membre |
| DELETE | `/api/projects/:id/members/:uid` | encadrant | Retirer un membre |
| GET  | `/api/projects/:pid/tasks` | auth | Liste tâches |
| POST | `/api/projects/:pid/tasks` | auth | Créer tâche |
| PUT  | `/api/projects/:pid/tasks/:id` | auth | Modifier tâche |
| PATCH | `/api/projects/:pid/tasks/:id/status` | auth | Changer statut |
| DELETE | `/api/projects/:pid/tasks/:id` | auth | Supprimer tâche |
| GET  | `/api/projects/:pid/deliverables` | auth | Liste livrables |
| POST | `/api/projects/:pid/deliverables` | auth | Upload fichier |
| DELETE | `/api/projects/:pid/deliverables/:id` | auth | Supprimer livrable |
| GET  | `/api/tasks/:tid/comments` | auth | Liste commentaires |
| POST | `/api/tasks/:tid/comments` | auth | Ajouter commentaire |
| DELETE | `/api/tasks/:tid/comments/:id` | auth | Supprimer commentaire |
| GET  | `/api/users?role=etudiant` | encadrant | Liste étudiants |

---

## Règles d'autorisation

- **Encadrant** : CRUD complet sur ses projets, gestion des membres
- **Étudiant** : lecture/écriture sur les projets dont il est membre, modification des tâches qui lui sont assignées, dépôt de livrables
- Les commentaires sont supprimables par leur auteur ou par un encadrant
