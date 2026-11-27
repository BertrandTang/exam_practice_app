/**
 * Logger applicatif (Winston).
 *
 * - Format JSON horodaté, écrit sur la sortie standard (collectée par Render / Docker).
 * - En local, `LOG_TO_FILE=true` ajoute `logs/error.log` et `logs/combined.log`.
 * - Silencieux pendant les tests.
 * @module config/logger
 */
const path = require('path');
const winston = require('winston');
const env = require('./env');

const transports = [new winston.transports.Console()];

if (env.logToFile) {
  const dir = path.join(__dirname, '..', 'logs');
  transports.push(
    new winston.transports.File({ filename: path.join(dir, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(dir, 'combined.log') }),
  );
}

/** @type {winston.Logger} */
const logger = winston.createLogger({
  level: env.logLevel,
  silent: env.nodeEnv === 'test',
  defaultMeta: { service: 'todo-api', env: env.appEnv },
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports,
});

module.exports = logger;
