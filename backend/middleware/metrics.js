/**
 * Métriques Prometheus exposées sur /metrics (supervision Grafana).
 * @module middleware/metrics
 */
const crypto = require('crypto');
const client = require('prom-client');
const env = require('../config/env');

const register = new client.Registry();
register.setDefaultLabels({ app: 'todo-api', env: env.appEnv });
client.collectDefaultMetrics({ register });

/** Durée des requêtes HTTP, par méthode, route et code de statut. */
const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Durée des requêtes HTTP en secondes',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

/** Nombre d'échecs de connexion (alerte brute force). */
const loginFailures = new client.Counter({
  name: 'auth_login_failures_total',
  help: 'Nombre de tentatives de connexion échouées',
  registers: [register],
});

/**
 * Mesure la durée de chaque requête. La route utilisée comme label est le
 * motif Express (ex. /api/tasks/:id) pour limiter la cardinalité.
 * @type {express.RequestHandler}
 */
function metricsMiddleware(req, res, next) {
  const end = httpDuration.startTimer();
  res.on('finish', () => {
    const route = req.route ? `${req.baseUrl}${req.route.path}` : 'unmatched';
    end({ method: req.method, route, status_code: res.statusCode });
  });
  next();
}

/**
 * Compare deux chaînes en temps constant.
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function safeEqual(a, b) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

/**
 * Handler de GET /metrics. Désactivé (404) si METRICS_TOKEN n'est pas défini.
 * Accepte `Authorization: Bearer <token>` ou Basic auth avec le token comme mot de passe.
 * @type {express.RequestHandler}
 */
async function metricsHandler(req, res) {
  if (!env.metricsToken) {
    return res.status(404).json({ msg: 'Ressource introuvable' });
  }
  const header = req.get('authorization') || '';
  let provided = '';
  if (header.startsWith('Bearer ')) {
    provided = header.slice(7);
  } else if (header.startsWith('Basic ')) {
    const decoded = Buffer.from(header.slice(6), 'base64').toString();
    provided = decoded.slice(decoded.indexOf(':') + 1);
  }
  if (!safeEqual(provided, env.metricsToken)) {
    res.set('WWW-Authenticate', 'Basic realm="metrics"');
    return res.status(401).json({ msg: 'Authentification requise' });
  }
  res.set('Content-Type', register.contentType);
  return res.send(await register.metrics());
}

module.exports = { metricsMiddleware, metricsHandler, loginFailures, register };
