# Déploiement — préproduction et production

## Architecture cible

```
                     ┌──────────────── Render (région Frankfurt) ────────────────┐
Navigateur ──HTTPS──▶│ Static Site (React)   todo.bazardim.fr                    │
                     │   /api/* ──rewrite──▶ Web Service Docker                  │──TLS──▶ MongoDB Atlas (M0)
                     │                       todo-api-prod-cob9.onrender.com          │
                     └───────────────────────────────────────────────────────────┘
DNS : zone bazardim.fr chez OVH (CNAME)   Certificats : Let's Encrypt, gérés par Render
```

Deux environnements identiques et isolés (services, base et secrets distincts) :

|             | Préproduction                     | Production                     |
| ----------- | --------------------------------- | ------------------------------ |
| Branche Git | `develop`                         | `main`                         |
| Frontend    | `staging.todo.bazardim.fr`        | `todo.bazardim.fr`             |
| API         | `staging.todo.bazardim.fr/api`    | `todo.bazardim.fr/api`         |
| Base Atlas  | base + utilisateur `todo-staging` | base + utilisateur `todo-prod` |
| Déploiement | automatique après la CI           | après approbation manuelle     |

**Pourquoi ces choix** : le frontend compilé est statique (CDN Render, pas de mise en veille) ; l'API est un serveur
Node qui doit tourner en continu avec une connexion MongoDB persistante (conteneur Docker) ; Atlas fournit une base
gérée, sauvegardée et chiffrée. Pas de serveur à administrer, HTTPS automatique, offres gratuites suffisantes pour ce projet.

**Limites de l'offre gratuite** : le Web Service se met en veille après une période d'inactivité (premier appel lent),
et les heures d'exécution gratuites sont plafonnées par mois pour l'ensemble du compte. Acceptable en préproduction ;
en production réelle, passer l'API sur une offre payante.

## 1. MongoDB Atlas

1. Créer un cluster **M0** (région Europe).
2. Utilisateurs de base de données — à ne pas confondre avec les membres du projet Atlas
   (_Access Manager_, qui demande une invitation par e-mail). Menu _Security → Database & Network Access_
   (anciennement _Database Access_), onglet des utilisateurs de base, _Add New Database User_ :
   - authentification par mot de passe, mot de passe **généré** (alphanumérique : pas d'encodage URL à gérer) ;
   - `todo-staging` avec le rôle **readWrite** sur la seule base `todo_staging` (_Specific Privileges_) ;
   - `todo-prod` avec le rôle **readWrite** sur la seule base `todo_prod`.
3. Accès réseau, même menu, onglet _IP Access List_ : _Add IP Address_ → `0.0.0.0/0`. Les services gratuits Render
   n'ont pas d'IP sortante fixe ; l'accès reste protégé par l'authentification et TLS.
   Raccourci : le bouton _Connect_ du cluster propose aussi ces deux étapes.
4. Chaînes de connexion (_Connect → Drivers_), en ajoutant le nom de la base après le `/` :
   `mongodb+srv://todo-prod:<mot de passe>@<cluster>.mongodb.net/todo_prod?retryWrites=true&w=majority`

## 2. Render

Les services de production suivent `main` : créer le Blueprint **après** la fusion `develop` → `main`, sinon le
premier déploiement de production construit l'ancien code et échoue.

1. _New → Blueprint_, sélectionner le dépôt et la branche `main` : Render lit [`render.yaml`](../render.yaml) et crée
   les 4 services (chaque service suit la branche indiquée dans le fichier).
2. Saisir `MONGO_URI` pour `todo-api-staging` et `todo-api-prod` (variables `sync: false`, demandées à la création).
   `JWT_SECRET` et `METRICS_TOKEN` sont générés automatiquement.
3. Pour chaque service : _Settings → Deploy Hook_, copier l'URL (utilisée par la CI). Tant que ces secrets sont
   absents de GitHub, l'étape de déploiement de la CI est ignorée avec un avertissement.

## 3. DNS (OVH) et HTTPS

Dans la zone DNS de `bazardim.fr`, ajouter uniquement ces enregistrements. Les enregistrements existants (`@`, `www`,
`ftp`, MX, SPF) ne sont pas touchés : les sous-domaines `todo` n'entrent pas en conflit avec eux.

| Sous-domaine   | Type  | Cible                              |
| -------------- | ----- | ---------------------------------- |
| `todo`         | CNAME | `todo-front-prod.onrender.com.`    |
| `staging.todo` | CNAME | `todo-front-staging.onrender.com.` |

**Pourquoi l'API n'a pas de domaine propre** : l'offre gratuite Render limite le compte à 2 domaines
personnalisés (au-delà, un moyen de paiement est exigé). Le frontend relaie donc `/api/*` vers le service API
(règle _rewrite_ de `render.yaml`). Bénéfices : un seul domaine par environnement, plus de CORS entre front et API,
et un cookie de session interne au site — un front sur `bazardim.fr` appelant une API sur `onrender.com`
ferait du cookie un cookie tiers, bloqué par Safari.

Les cibles exactes sont affichées par Render (_Settings → Custom Domains_) : si un nom est déjà pris, Render ajoute un
suffixe. La zone ne contient aucun enregistrement **CAA**, donc Let's Encrypt est autorisé par défaut. Render émet puis renouvelle automatiquement les certificats Let's Encrypt et
redirige HTTP vers HTTPS.

**Vérifications**

```bash
dig +short todo.bazardim.fr                             # résolution vers Render
curl -vI https://todo.bazardim.fr/ 2>&1 | grep -E "subject|issuer|expire|HTTP/"
curl -s https://todo-api-prod-cob9.onrender.com/health        # API : {"status":"ok","db":"up",…}
curl -s https://todo.bazardim.fr/api/auth/me             # API via le relais : 401 attendu sans session
```

Puis [SSL Labs](https://www.ssllabs.com/ssltest/) sur chaque domaine (objectif : note A).

> Le cookie de session est `SameSite=Lax` et sans attribut `Domain` : il est rattaché au domaine du frontend,
> qui relaie les appels `/api/*`. Le navigateur ne voit qu'une seule origine.

## 4. GitHub

1. _Settings → Environments_ : créer `staging` et `production` ; pour `production`, ajouter un
   _Required reviewer_ et restreindre aux branches `main`.
2. Dans chaque environnement, ajouter les secrets `RENDER_DEPLOY_HOOK_API` et `RENDER_DEPLOY_HOOK_FRONT`.
3. _Settings → Branches_ : protéger `main` (pull request obligatoire, CI verte).
4. _Settings → Code security_ : activer les alertes Dependabot.

## 5. Cycle de livraison

```
feature/* ──PR──▶ develop ──(CI verte)──▶ préproduction ──PR──▶ main ──(CI + approbation)──▶ production
```

Le pipeline [`.github/workflows/ci-cd.yml`](../.github/workflows/ci-cd.yml) exécute : installation → lint → format →
tests (MongoDB en service) → `npm audit` → documentation → build des images Docker (poussées sur GHCR avec le tag
`<branche>-<sha>`) → appel des deploy hooks Render.

**Retour arrière** : dans Render, _Events → Rollback_ vers le déploiement précédent, ou `git revert` puis nouveau push.
