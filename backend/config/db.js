/**
 * Connexion à MongoDB via Mongoose.
 * @module config/db
 */
const mongoose = require('mongoose');
const debug = require('debug')('app:db');
const logger = require('./logger');

// Défense en profondeur contre l'injection d'opérateurs NoSQL ({ "$gt": "" })
// dans les filtres de requêtes, en plus de la validation Joi.
mongoose.set('sanitizeFilter', true);

/**
 * Ouvre la connexion à MongoDB.
 * @param {string} uri - URI de connexion (MONGO_URI).
 * @returns {Promise<mongoose.Mongoose>} L'instance Mongoose connectée.
 */
async function connectDB(uri) {
  debug('Connexion à MongoDB…');
  const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  logger.info('MongoDB connecté', { host: conn.connection.host, db: conn.connection.name });
  return conn;
}

/**
 * Ferme la connexion à MongoDB.
 * @returns {Promise<void>}
 */
async function disconnectDB() {
  await mongoose.disconnect();
}

/**
 * Indique si la connexion MongoDB est opérationnelle.
 * @returns {boolean}
 */
function isDBConnected() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connectDB, disconnectDB, isDBConnected };
