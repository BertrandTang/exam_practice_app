# Supervision et alertes (Grafana Cloud)

## Sources

| Source         | Contenu                                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| `GET /health`  | `200 { status: "ok", db: "up" }` ou `503` si MongoDB est indisponible (health check Docker et Render)     |
| `GET /metrics` | Format Prometheus, protégé par `METRICS_TOKEN` (Bearer ou Basic)                                          |
| Logs Render    | JSON Winston : requêtes HTTP, `auth.login_failed`, `auth.rate_limited`, `task.access_denied`, erreurs 500 |

Métriques exposées (étiquettes communes `app="todo-api"`, `env="staging"|"production"`) :

- `http_request_duration_seconds` (histogramme ; `method`, `route`, `status_code`)
- `auth_login_failures_total` (compteur)
- métriques Node.js par défaut : `process_resident_memory_bytes`, `nodejs_eventloop_lag_seconds`…
- `up` : ajoutée par Grafana à chaque collecte (0 si l'endpoint ne répond pas)

## Mise en place

1. Grafana Cloud (offre gratuite) → _Connections → Add new connection → Metrics Endpoint_.
2. Créer un job par environnement :
   - URL : `https://todo-api-prod-cob9.onrender.com/metrics` (et `https://todo-api-staging-gs7r.onrender.com/metrics`) —
     `/metrics` n'est pas relayé par le frontend, il est appelé directement sur le service API
   - Authentification : Bearer, valeur = `METRICS_TOKEN` du service Render
   - Intervalle : 60 s
3. Créer un tableau de bord avec les requêtes ci-dessous.

> Le scraping régulier empêche la mise en veille du service gratuit et consomme donc des heures d'exécution :
> en offre gratuite, superviser en priorité la production.

## Tableau de bord

| Panneau                   | Requête PromQL                                                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Requêtes / s              | `sum by (env) (rate(http_request_duration_seconds_count[5m]))`                                                                                    |
| Latence p95               | `histogram_quantile(0.95, sum by (le, env) (rate(http_request_duration_seconds_bucket{route!="unmatched"}[5m])))`                                 |
| Taux d'erreurs 5xx        | `sum by (env) (rate(http_request_duration_seconds_count{status_code=~"5.."}[5m])) / sum by (env) (rate(http_request_duration_seconds_count[5m]))` |
| Échecs de connexion / min | `sum by (env) (increase(auth_login_failures_total[1m]))`                                                                                          |
| Mémoire                   | `process_resident_memory_bytes`                                                                                                                   |

## Alertes (contact : e-mail)

| Alerte               | Condition                                           | Durée  | Sévérité      |
| -------------------- | --------------------------------------------------- | ------ | ------------- |
| API indisponible     | `up{env="production"} == 0` ou absence de métriques | 2 min  | critique      |
| Latence élevée       | p95 > 0,5 s                                         | 5 min  | avertissement |
| Taux d'erreurs       | 5xx > 5 %                                           | 5 min  | critique      |
| Brute force probable | > 20 échecs de connexion / min                      | 1 min  | avertissement |
| Mémoire              | > 400 Mo (limite 512 Mo en offre gratuite)          | 10 min | avertissement |

En préproduction, mêmes règles avec des seuils plus souples et une notification e-mail uniquement.

## Logs

Render conserve les logs de chaque service (_Logs_, filtre par texte) : rechercher par exemple
`auth.login_failed` ou `"level":"error"`. Pour une conservation plus longue, ajouter un _Log Stream_ Render
vers Grafana Loki.
