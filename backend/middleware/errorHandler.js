/**
 * Gestion centralisée des erreurs.
 *
 * Avec Express 5, les erreurs levées dans les handlers async sont transmises
 * automatiquement à ce middleware : le serveur ne plante plus sur une
 * promesse rejetée.
 * @module middleware/errorHandler
 */
const mongoose = require('mongoose');
const logger = require('../config/logger');

/**
 * Répond 404 pour toute route inconnue.
 * @type {express.RequestHandler}
 */
function notFound(req, res) {
  res.status(404).json({ msg: 'Ressource introuvable' });
}

/**
 * Convertit les erreurs en réponses JSON `{ msg }` :
 * - JSON mal formé ou trop gros → 400 / 413
 * - erreurs de validation / de cast Mongoose → 400
 * - doublon (index unique) → 409
 * - tout le reste → 500, sans détail technique pour le client
 * @type {express.ErrorRequestHandler}
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ msg: 'Corps de requête JSON invalide' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ msg: 'Requête trop volumineuse' });
  }
  if (err instanceof mongoose.Error.ValidationError || err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ msg: 'Données invalides' });
  }
  if (err.code === 11000) {
    return res.status(409).json({ msg: 'Cette ressource existe déjà' });
  }

  logger.error('unhandled_error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.originalUrl,
  });
  return res.status(500).json({ msg: 'Erreur serveur, veuillez réessayer plus tard' });
}

module.exports = { notFound, errorHandler };
