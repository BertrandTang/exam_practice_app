/**
 * Journalisation des requêtes HTTP via Winston.
 * @module middleware/requestLogger
 */
const logger = require('../config/logger');

/** Routes techniques non journalisées (appelées en boucle par la supervision). */
const SKIPPED = new Set(['/health', '/metrics']);

/**
 * Journalise chaque requête à la fin de la réponse : méthode, chemin, statut,
 * durée, IP et utilisateur. Niveau : `error` (5xx), `warn` (4xx), `info` sinon.
 * Le corps des requêtes n'est jamais journalisé (mots de passe).
 * @type {express.RequestHandler}
 */
function requestLogger(req, res, next) {
  if (SKIPPED.has(req.path)) return next();
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logger.log(level, 'http_request', {
      method: req.method,
      path: req.originalUrl.split('?')[0],
      status: res.statusCode,
      durationMs: Math.round(durationMs * 10) / 10,
      ip: req.ip,
      // En debug (préproduction) : chaîne de proxys, pour régler TRUST_PROXY.
      forwardedFor: logger.isDebugEnabled() ? req.headers['x-forwarded-for'] : undefined,
      userId: req.user?.id,
    });
  });
  next();
}

module.exports = requestLogger;
