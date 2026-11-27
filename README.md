# Mes Tâches — application de gestion de tâches

Application « To-Do List » : un frontend **React** (Vite) et une API **Node.js / Express** reliée à **MongoDB**.
Chaque utilisateur crée un compte, se connecte et gère ses propres tâches (ajout, modification, case « terminée », suppression).

> Consigne d'origine de l'exercice : [docs/CONSIGNES.md](docs/CONSIGNES.md) — historique des corrections : [CHANGELOG.md](CHANGELOG.md).

## Architecture

```
frontend/   React 19 + Vite + React Router — appels API avec cookie de session (axios)
backend/    Express 5 + Mongoose 9 — validation Joi, JWT en cookie httpOnly, Winston, Prometheus
docker-compose.yml   MongoDB + API + frontend (nginx) en local
render.yaml          Infrastructure Render : préproduction (develop) et production (main)
.github/             CI/CD GitHub Actions + Dependabot
docs/                Déploiement, supervision, consigne
```

| Environnement | Branche   | Frontend                         | API                                      |
| ------------- | --------- | -------------------------------- | ---------------------------------------- |
| Local         | —         | http://localhost:5173            | http://localhost:5050/api                |
| Docker local  | —         | http://localhost:8080            | http://localhost:5050/api                |
| Préproduction | `develop` | https://staging.todo.bazardim.fr | https://staging.todo.bazardim.fr/api (¹) |
| Production    | `main`    | https://todo.bazardim.fr         | https://todo.bazardim.fr/api (¹)         |

(¹) Render relaie `/api/*` vers le service API (`todo-api-*.onrender.com`) : frontend et API partagent le même
domaine, le cookie de session n'est donc jamais un cookie tiers.

> Sur macOS, le port 5000 est occupé par le récepteur AirPlay : l'API est exposée sur **5050** en local.

## Démarrage rapide

### Avec Docker (recommandé)

```bash
cp .env.example .env          # puis renseigner JWT_SECRET (commande dans le fichier)
docker compose up --build
```

Frontend : http://localhost:8080 — API : http://localhost:5050/health

### Sans Docker

Prérequis : Node.js ≥ 22 et MongoDB démarré (`brew services start mongodb-community`).

```bash
# API
cd backend
cp .env.example .env          # renseigner JWT_SECRET, mettre PORT=5050
npm install
npm run dev                   # redémarre à chaque modification

# Frontend (autre terminal)
cd frontend
cp .env.example .env          # VITE_API_URL=http://localhost:5050/api
npm install
npm run dev                   # http://localhost:5173
```

## Scripts

| Dossier    | Commande                  | Rôle                                                 |
| ---------- | ------------------------- | ---------------------------------------------------- |
| `backend`  | `npm run dev`             | API avec rechargement automatique                    |
| `backend`  | `npm test`                | Tests d'intégration (node:test + Supertest, MongoDB) |
| `backend`  | `npm run docs`            | Documentation JSDoc générée dans `backend/docs/`     |
| `backend`  | `DEBUG=app:* npm run dev` | Traces de développement du module `debug`            |
| `frontend` | `npm run dev` / `build`   | Serveur de développement / build de production       |
| les deux   | `npm run lint`            | ESLint                                               |
| les deux   | `npm run format`          | Prettier                                             |

Les tests utilisent `MONGO_URI_TEST` (défaut `mongodb://127.0.0.1:27017/todo_test`) ; la base est vidée à chaque exécution.

## API

Toutes les réponses sont en JSON ; les erreurs ont la forme `{ "msg": "..." }`.

| Méthode | Route                | Accès    | Description                                      |
| ------- | -------------------- | -------- | ------------------------------------------------ |
| POST    | `/api/auth/register` | public   | Crée un compte et ouvre la session (cookie)      |
| POST    | `/api/auth/login`    | public   | Ouvre la session (cookie httpOnly)               |
| POST    | `/api/auth/logout`   | public   | Ferme la session                                 |
| GET     | `/api/auth/me`       | connecté | Utilisateur courant                              |
| GET     | `/api/tasks`         | connecté | Liste ses tâches                                 |
| POST    | `/api/tasks`         | connecté | Crée une tâche `{ title, description? }`         |
| PUT     | `/api/tasks/:id`     | connecté | Modifie `{ title?, description?, isCompleted? }` |
| DELETE  | `/api/tasks/:id`     | connecté | Supprime une de ses tâches                       |
| GET     | `/health`            | public   | État de l'API et de MongoDB                      |
| GET     | `/metrics`           | jeton    | Métriques Prometheus (`METRICS_TOKEN`)           |

Détail des fonctions et modules : `cd backend && npm run docs`, puis ouvrir `backend/docs/index.html`.

## Sécurité

- Session JWT dans un **cookie httpOnly**, `Secure` en HTTPS, `SameSite=Lax` — plus de token dans `localStorage`.
- Chaque route de tâche filtre sur le propriétaire (correction IDOR).
- Validation **Joi** de toutes les entrées (types, longueurs, balises HTML refusées) + `sanitizeFilter` Mongoose.
- `helmet`, CORS limité au frontend, limitation à 10 tentatives / 15 min sur l'authentification.
- Secrets uniquement en variables d'environnement ; le serveur refuse de démarrer sans `JWT_SECRET` (≥ 32 caractères en production).
- Conteneurs exécutés avec un utilisateur non-root ; CSP stricte sur le frontend.

## Journalisation et supervision

- **Winston** : logs JSON sur la sortie standard (collectés par Docker / Render), requêtes HTTP et événements de sécurité (`auth.login_failed`, `auth.rate_limited`, `task.access_denied`…). `LOG_TO_FILE=true` écrit aussi dans `backend/logs/`.
- **Prometheus / Grafana Cloud** : `/metrics` expose latence, codes HTTP, échecs de connexion et métriques Node.js. Voir [docs/SUPERVISION.md](docs/SUPERVISION.md).

## Déploiement

CI/CD GitHub Actions : tests à chaque pull request, déploiement de la préproduction à chaque push sur `develop`, de la production sur `main` après approbation.
Procédure complète (Atlas, Render, DNS OVH, HTTPS) : [docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md).
