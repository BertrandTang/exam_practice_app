/**
 * Middleware d'authentification.
 * @module middleware/auth
 */
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const logger = require('../config/logger');

/** Nom du cookie httpOnly qui transporte le JWT. */
const COOKIE_NAME = 'token';

/**
 * Vérifie le JWT présent dans le cookie httpOnly `token`.
 * En cas de succès, expose `req.user = { id }` ; sinon répond 401.
 *
 * Le token n'est plus lu depuis un en-tête rempli par le front depuis
 * localStorage : un cookie httpOnly n'est pas accessible en JavaScript,
 * ce qui empêche son vol en cas de faille XSS.
 *
 * @type {express.RequestHandler}
 */
function auth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ msg: 'Authentification requise' });
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
    req.user = { id: decoded.user.id };
    return next();
  } catch (err) {
    logger.warn('auth.invalid_token', { reason: err.name, ip: req.ip });
    return res.status(401).json({ msg: 'Session expirée ou invalide, veuillez vous reconnecter' });
  }
}

module.exports = auth;
module.exports.COOKIE_NAME = COOKIE_NAME;
