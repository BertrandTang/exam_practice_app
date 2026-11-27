/**
 * Routes d'authentification : /api/auth
 * @module routes/auth
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const debug = require('debug')('app:auth');
const User = require('../models/User');
const env = require('../config/env');
const logger = require('../config/logger');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimit');
const { loginFailures } = require('../middleware/metrics');
const { registerSchema, loginSchema } = require('../validators/schemas');

const router = express.Router();
const { COOKIE_NAME } = auth;

/**
 * Options du cookie de session.
 * - httpOnly : illisible en JavaScript (protection XSS)
 * - secure : HTTPS uniquement (production)
 * - sameSite=lax (défaut) : non envoyé par les requêtes d'autres sites (protection CSRF)
 * @returns {express.CookieOptions}
 */
function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: '/',
  };
}

/**
 * Signe un JWT pour l'utilisateur et le place dans le cookie httpOnly.
 * La signature est synchrone : plus de `throw` dans un callback qui
 * faisait planter le serveur.
 * @param {express.Response} res
 * @param {{ id: string }} user
 */
function setSessionCookie(res, user) {
  const token = jwt.sign({ user: { id: user.id } }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
    algorithm: 'HS256',
  });
  res.cookie(COOKIE_NAME, token, { ...cookieOptions(), maxAge: env.jwtExpiresIn * 1000 });
}

/**
 * Formate un utilisateur pour les réponses de l'API.
 * @param {{ id: string, username: string }} user
 * @returns {{ id: string, username: string }}
 */
const publicUser = (user) => ({ id: user.id, username: user.username });

/**
 * POST /api/auth/register — Crée un compte et ouvre la session.
 *
 * Corps : `{ username, password }` (validé par Joi).
 * Réponses : 201 `{ user }` + cookie, 400 données invalides,
 * 409 nom déjà pris, 429 trop de tentatives.
 */
router.post('/register', authLimiter, validate(registerSchema), async (req, res) => {
  const { username, password } = req.body;

  const exists = await User.exists({ username });
  if (exists) {
    return res.status(409).json({ msg: "Ce nom d'utilisateur n'est pas disponible" });
  }

  const hash = await bcrypt.hash(password, 12);
  const user = await User.create({ username, password: hash });

  logger.info('auth.registered', { userId: user.id });
  setSessionCookie(res, user);
  return res.status(201).json({ user: publicUser(user) });
});

/**
 * POST /api/auth/login — Ouvre une session.
 *
 * Corps : `{ username, password }`.
 * Réponses : 200 `{ user }` + cookie, 400 identifiants invalides
 * (message volontairement identique que le compte existe ou non),
 * 429 trop de tentatives.
 */
router.post('/login', authLimiter, validate(loginSchema), async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username }).select('+password');
  const valid = user ? await bcrypt.compare(password, user.password) : false;

  if (!valid) {
    loginFailures.inc();
    logger.warn('auth.login_failed', { username, ip: req.ip });
    return res.status(400).json({ msg: "Nom d'utilisateur ou mot de passe incorrect" });
  }

  debug('Connexion réussie pour %s', user.id);
  logger.info('auth.login_success', { userId: user.id, ip: req.ip });
  setSessionCookie(res, user);
  return res.json({ user: publicUser(user) });
});

/**
 * POST /api/auth/logout — Ferme la session en supprimant le cookie.
 * Réponse : 200 `{ msg }`.
 */
router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions());
  return res.json({ msg: 'Déconnecté' });
});

/**
 * GET /api/auth/me — Renvoie l'utilisateur connecté.
 * Permet au front de savoir s'il a une session valide (le cookie
 * httpOnly n'est pas lisible en JavaScript).
 * Réponses : 200 `{ user }`, 401 non connecté ou session expirée.
 */
router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    res.clearCookie(COOKIE_NAME, cookieOptions());
    return res.status(401).json({ msg: 'Authentification requise' });
  }
  return res.json({ user: publicUser(user) });
});

module.exports = router;
