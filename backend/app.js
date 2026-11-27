/**
 * Construction de l'application Express (sans démarrage du serveur),
 * ce qui permet de la tester avec Supertest.
 * @module app
 */
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const requestLogger = require('./middleware/requestLogger');
const { metricsMiddleware, metricsHandler } = require('./middleware/metrics');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// IP réelle du client derrière les proxys (voir TRUST_PROXY).
if (env.trustProxy) app.set('trust proxy', env.trustProxy);

// En-têtes de sécurité HTTP (X-Content-Type-Options, HSTS, CSP…)
app.use(helmet());

// CORS limité aux origines du frontend ; credentials pour le cookie de session.
app.use(
  cors({
    origin: env.corsOrigins,
    credentials: true,
  }),
);

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(requestLogger);
app.use(metricsMiddleware);

app.use('/health', require('./routes/health'));
app.get('/metrics', metricsHandler);
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
