/**
 * Chargement et validation des variables d'environnement.
 *
 * Le serveur refuse de démarrer si une variable obligatoire est absente
 * ou si le secret JWT est trop faible en production.
 * @module config/env
 */
require('dotenv').config({ quiet: true });

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Lit une variable obligatoire.
 * @param {string} name - Nom de la variable.
 * @returns {string} La valeur.
 * @throws {Error} Si la variable est absente ou vide.
 */
function required(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Variable d'environnement manquante : ${name}`);
  }
  return value.trim();
}

const jwtSecret = required('JWT_SECRET');
if (isProduction && jwtSecret.length < 32) {
  throw new Error('JWT_SECRET doit contenir au moins 32 caractères en production');
}

/**
 * Configuration de l'application (objet figé).
 * @typedef {object} Env
 * @property {string} nodeEnv - development | production | test
 * @property {string} appEnv - Nom de l'environnement déployé (staging, production…),
 *   utilisé comme étiquette dans les logs et les métriques.
 * @property {boolean} isProduction
 * @property {number} port - Port HTTP (défaut 5000).
 * @property {string} mongoUri - URI MongoDB.
 * @property {string} jwtSecret - Secret de signature des JWT.
 * @property {number} jwtExpiresIn - Durée de session en secondes.
 * @property {string[]} corsOrigins - Origines autorisées par CORS.
 * @property {boolean} cookieSecure - Cookie limité au HTTPS.
 * @property {'lax'|'strict'|'none'} cookieSameSite - Politique SameSite du cookie.
 * @property {number} trustProxy - Nombre de proxys de confiance.
 * @property {string|undefined} metricsToken - Jeton de /metrics.
 * @property {string} logLevel - Niveau Winston.
 * @property {boolean} logToFile - Écriture des logs dans logs/.
 */

if (process.env.COOKIE_SAMESITE === 'none' && process.env.COOKIE_SECURE === 'false') {
  throw new Error('COOKIE_SAMESITE=none exige un cookie secure (HTTPS)');
}

/** @type {Env} */
const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  appEnv: process.env.APP_ENV || process.env.NODE_ENV || 'development',
  isProduction,
  port: Number(process.env.PORT) || 5000,
  mongoUri: required('MONGO_URI'),
  jwtSecret,
  /** Durée de vie du token et du cookie, en secondes (1 h). */
  jwtExpiresIn: Number(process.env.JWT_EXPIRES_IN) || 3600,
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  cookieSecure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : isProduction,
  // "lax" par défaut : front et API sur le même site (todo.bazardim.fr / api.todo.bazardim.fr).
  // "none" seulement si front et API sont sur des sites différents (ex. *.onrender.com).
  cookieSameSite: ['lax', 'strict', 'none'].includes(process.env.COOKIE_SAMESITE)
    ? process.env.COOKIE_SAMESITE
    : 'lax',
  trustProxy: Number(process.env.TRUST_PROXY) || 0,
  metricsToken: process.env.METRICS_TOKEN || undefined,
  logLevel: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  logToFile: process.env.LOG_TO_FILE === 'true',
});

module.exports = env;
