/**
 * Route de santé : GET /health
 * @module routes/health
 */
const express = require('express');
const { isDBConnected } = require('../config/db');

const router = express.Router();

/**
 * GET /health — État de l'API et de la connexion MongoDB.
 * Utilisée par le HEALTHCHECK Docker, le health check Render et la supervision.
 * Réponses : 200 `{ status: 'ok', db: 'up' }`, 503 `{ status: 'error', db: 'down' }`.
 */
router.get('/', (req, res) => {
  const dbUp = isDBConnected();
  res.status(dbUp ? 200 : 503).json({
    status: dbUp ? 'ok' : 'error',
    db: dbUp ? 'up' : 'down',
    uptime: Math.round(process.uptime()),
  });
});

module.exports = router;
