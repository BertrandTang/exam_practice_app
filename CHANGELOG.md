# Journal des évolutions

Toutes les évolutions notables du projet sont consignées ici.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) — versions : [SemVer](https://semver.org/lang/fr/).
Les références `S#` (sécurité) et `B#` (bugs) renvoient à l'audit initial.

## [Non publié]

## [1.0.0] — 2026-11-27

### Sécurité (E28)

- **S1 — IDOR** : `PUT` et `DELETE /api/tasks/:id` ne vérifiaient pas le propriétaire ; n'importe quel utilisateur connecté pouvait modifier ou supprimer les tâches des autres. Les requêtes filtrent désormais sur `{ _id, user }` et répondent 404 sans révéler l'existence de la tâche ; la tentative est journalisée (`task.access_denied`). Le commentaire « Ici c'est corrigé » de la route `PUT` était faux.
- **S2 — Secrets** : `JWT_SECRET=secretkey123` était faible et le fichier `.env` était versionné. Ajout d'un `.gitignore`, retrait de `.env` de l'historique, `.env.example` documenté, nouveau secret aléatoire de 64 octets, et refus de démarrer si une variable obligatoire manque (secret ≥ 32 caractères en production).
- **S3 — CORS** : `cors()` acceptait toutes les origines. Limité à `CORS_ORIGIN` (avec `credentials` pour le cookie).
- **S4 — Validation des entrées** : aucun contrôle de type ni de longueur ; un objet `{ "$gt": "" }` pouvait être injecté dans les requêtes MongoDB, et `PUT` acceptait `title: null` (validateurs non exécutés). Ajout de schémas **Joi** pour toutes les routes, de `sanitizeFilter` Mongoose, de `runValidators` et de contraintes `trim` / `maxlength` dans les modèles.
- **XSS** : React échappait déjà l'affichage (`{task.title}`), la faille n'était donc pas exploitable dans l'interface ; par défense en profondeur, l'API refuse désormais les balises HTML dans les titres et descriptions, et le frontend est servi avec une Content-Security-Policy stricte.
- **S5 — Brute force et en-têtes** : limitation à 10 tentatives par IP et par 15 minutes sur `/login` et `/register` (`express-rate-limit`), en-têtes de sécurité `helmet`, mot de passe de 8 caractères minimum, corps JSON limité à 10 ko.
- **S6 — Stockage du token** : le JWT était stocké dans `localStorage`, lisible par tout script en cas de XSS. Il est maintenant dans un cookie `httpOnly`, `Secure` (HTTPS) et `SameSite=Lax` ; ajout des routes `/api/auth/logout` et `/api/auth/me`.
- **S7 — Énumération de comptes** : le message de connexion reste volontairement identique que le compte existe ou non (le commentaire qui le présentait comme un défaut était trompeur). À l'inscription, un nom déjà pris renvoie 409 : inévitable pour un identifiant choisi par l'utilisateur, mais atténué par la limitation de tentatives.
- **S8 — Dépendances** : `npm audit` signalait 8 vulnérabilités dans le backend (dont 2 critiques : Mongoose 7, `proxy-addr`) et 67 dans le frontend (dont 3 critiques, liées à Create React App, abandonné). Après mise à jour : **0 vulnérabilité** des deux côtés.
- Hash bcrypt (coût 12) jamais renvoyé par l'API (`select: false` + transformation JSON) ; conteneurs exécutés avec un utilisateur non-root.

### Corrigé (E27)

- **B1** — Une tâche ajoutée n'apparaissait qu'après rechargement de la page (`addTask` vide) : la liste est mise à jour immédiatement.
- **B2** — `throw err` dans le callback de `jwt.sign` pouvait arrêter le serveur : signature synchrone, gestion centralisée des erreurs, arrêt propre sur `SIGTERM`.
- **B3** — Un titre vide ou un identifiant mal formé renvoyait une erreur 500 : réponses 400 avec un message explicite.
- **B4** — Un token invalide renvoyait le code 418 (« I'm a teapot ») : 401.
- **B5** — Une session expirée n'était pas gérée (promesse non interceptée, liste vide, bouton « Déconnexion » toujours affiché) : redirection vers la connexion avec le message « Votre session a expiré ».
- **B6** — Aucun retour en cas d'erreur (mauvais identifiants, formulaire vide, serveur injoignable) : messages d'erreur et de succès affichés, boutons désactivés pendant les envois.
- **B7** — La déconnexion laissait la liste affichée et `/` redirigeait toujours vers `/login` : redirection selon l'état de session et routes protégées.
- **B8** — Impossible de modifier une tâche ou de la marquer terminée (route `PUT` jamais appelée) : case à cocher, mode édition (titre et description), suppression avec confirmation.
- **B9** — Aucun lien vers l'inscription : liens Connexion / Inscription dans l'en-tête et entre les deux pages.
- **B10** — `<header>` imbriqué deux fois, `App.css` importé deux fois, styles en double et défilement horizontal (`100vw`), interface mi-anglais mi-français : structure et CSS nettoyés, interface entièrement en français.
- **B11** — `deleteTask` utilisait une liste potentiellement périmée : mises à jour d'état fonctionnelles.
- **B12** — URL de l'API écrite en dur : variable `VITE_API_URL` par environnement.
- `findByIdAndRemove` (supprimé dans Mongoose 8) et options de connexion obsolètes retirés.

### Ajouté

- Tests d'intégration de l'API (25 tests : authentification, CRUD, IDOR, validation, injection, XSS, en-têtes) avec `node:test` et Supertest.
- ESLint et Prettier (backend et frontend), `.editorconfig`.
- Documentation JSDoc des modules backend (`npm run docs`) et commentaires de documentation des composants React.
- Journalisation **Winston** (JSON horodaté sur la sortie standard, fichiers en local), journal des requêtes HTTP et des événements de sécurité ; module `debug` pour le développement.
- Route `/health` (API + MongoDB) et route `/metrics` Prometheus protégée par jeton (latence, codes HTTP, échecs de connexion).
- `Dockerfile` backend et frontend (build multi-étapes, nginx non-root), `docker-compose.yml` avec MongoDB.
- Pipeline **GitHub Actions** (lint, format, tests, audit, documentation, images Docker sur GHCR, déploiement préproduction / production), **Dependabot**, Blueprint **Render** (`render.yaml`).
- Documentation : `README.md`, `docs/DEPLOIEMENT.md`, `docs/SUPERVISION.md`.

### Modifié

- Frontend migré de Create React App (abandonné) vers **Vite 8** ; React 18 → 19, React Router 6 → 8.
- Backend : Express 4 → 5 (erreurs asynchrones gérées nativement), Mongoose 7 → 9, bcryptjs 2 → 3, dotenv 16 → 18.
- Séparation `app.js` (application) / `server.js` (démarrage) pour les tests.
- Port local de l'API : 5050 (le port 5000 est occupé par AirPlay sur macOS).

## [0.1.0] — 2025-10-09

- Version initiale fournie pour l'exercice.

[Non publié]: https://github.com/BertrandTang/exam_practice_app/compare/v1.0.0...develop
[1.0.0]: https://github.com/BertrandTang/exam_practice_app/releases/tag/v1.0.0
