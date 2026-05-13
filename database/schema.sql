-- ============================================================
-- Schéma PostgreSQL - Plateforme de gestion projets étudiants
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Nettoyage (ordre inversé des dépendances)
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS deliverables CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  nom         VARCHAR(100) NOT NULL,
  email       VARCHAR(255) NOT NULL UNIQUE,
  password    TEXT NOT NULL,                -- bcrypt hash
  role        VARCHAR(20) NOT NULL CHECK (role IN ('encadrant', 'etudiant')),
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE projects (
  id            SERIAL PRIMARY KEY,
  titre         VARCHAR(255) NOT NULL,
  description   TEXT,
  date_debut    DATE,
  date_fin      DATE,
  encadrant_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- PROJECT MEMBERS  (table de liaison many-to-many)
-- ============================================================
CREATE TABLE project_members (
  project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at   TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

-- ============================================================
-- TASKS
-- ============================================================
CREATE TABLE tasks (
  id            SERIAL PRIMARY KEY,
  project_id    INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  titre         VARCHAR(255) NOT NULL,
  description   TEXT,
  statut        VARCHAR(20) NOT NULL DEFAULT 'todo'
                  CHECK (statut IN ('todo', 'in_progress', 'done')),
  assigne_a     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  deadline      DATE,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- DELIVERABLES
-- ============================================================
CREATE TABLE deliverables (
  id            SERIAL PRIMARY KEY,
  project_id    INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  nom_fichier   VARCHAR(255) NOT NULL,
  url           TEXT NOT NULL,             -- chemin relatif ou URL stockage
  uploade_par   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- COMMENTS
-- ============================================================
CREATE TABLE comments (
  id          SERIAL PRIMARY KEY,
  task_id     INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contenu     TEXT NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEX
-- ============================================================
CREATE INDEX idx_projects_encadrant   ON projects(encadrant_id);
CREATE INDEX idx_tasks_project        ON tasks(project_id);
CREATE INDEX idx_tasks_assigne        ON tasks(assigne_a);
CREATE INDEX idx_deliverables_project ON deliverables(project_id);
CREATE INDEX idx_comments_task        ON comments(task_id);
CREATE INDEX idx_pm_user              ON project_members(user_id);

-- ============================================================
-- TRIGGER : updated_at auto-refresh sur tasks
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- DONNÉES DE TEST (optionnel — commenter en prod)
-- ============================================================
-- Encadrant
INSERT INTO users (nom, email, password, role) VALUES
  ('Prof. Dupont', 'dupont@junia.com',
   '$2b$10$example_hash_replace_me', 'encadrant');

-- Étudiants
INSERT INTO users (nom, email, password, role) VALUES
  ('Alice Martin',  'alice@student.junia.com',  '$2b$10$example_hash_replace_me', 'etudiant'),
  ('Bob Lefevre',   'bob@student.junia.com',    '$2b$10$example_hash_replace_me', 'etudiant'),
  ('Clara Petit',   'clara@student.junia.com',  '$2b$10$example_hash_replace_me', 'etudiant');
