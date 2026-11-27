/**
 * Limitation du nombre de tentatives sur les routes d'authentification
 * (protection contre le brute force).
 * @module middleware/rateLimit
 */
const { rateLimit } = require('express-rate-limit');
const logger = require('../config/logger');
const env = require('../config/env');

/**
 * 10 tentatives par IP et par fenêtre de 15 minutes sur /login et /register.
 * @type {express.RequestHandler}
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => env.nodeEnv === 'test',
  handler: (req, res, _next, options) => {
    logger.warn('auth.rate_limited', { ip: req.ip, path: req.originalUrl });
    res.status(options.statusCode).json({
      msg: 'Trop de tentatives, réessayez dans quelques minutes',
    });
  },
});

module.exports = { authLimiter };
