/**
 * Point d'entrée : connexion à MongoDB puis démarrage du serveur HTTP.
 * Gère l'arrêt propre (SIGTERM envoyé par Docker / Render) et journalise
 * les erreurs non interceptées avant de quitter.
 * @module server
 */
let env;
try {
  env = require('./config/env');
} catch (err) {
  // Le logger dépend de la configuration : on ne peut utiliser que la console ici.
  // eslint-disable-next-line no-console
  console.error(JSON.stringify({ level: 'error', message: err.message }));
  process.exit(1);
}

const logger = require('./config/logger');

const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');

/**
 * Démarre l'API.
 * @returns {Promise<void>}
 */
async function start() {
  await connectDB(env.mongoUri);
  const server = app.listen(env.port, () => {
    logger.info('Serveur démarré', { port: env.port, nodeEnv: env.nodeEnv });
  });

  const shutdown = (signal) => {
    logger.info('Arrêt du serveur', { signal });
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

process.on('unhandledRejection', (reason) => {
  logger.error('unhandled_rejection', { reason: String(reason) });
});
process.on('uncaughtException', (err) => {
  logger.error('uncaught_exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

start().catch((err) => {
  logger.error('Échec du démarrage', { error: err.message });
  process.exit(1);
});
