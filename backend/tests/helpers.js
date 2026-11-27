/**
 * Utilitaires de test : configuration de l'environnement, connexion à une
 * base MongoDB dédiée et création d'utilisateurs connectés.
 *
 * Base utilisée : MONGO_URI_TEST, sinon mongodb://127.0.0.1:27017/todo_test.
 */
const crypto = require('node:crypto');

/** Valeur aléatoire à chaque exécution : aucun identifiant n'est écrit en dur dans les tests. */
const randomSecret = (bytes = 12) => crypto.randomBytes(bytes).toString('base64url');

process.env.NODE_ENV = 'test';
process.env.MONGO_URI = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/todo_test';
process.env.JWT_SECRET = randomSecret(48);
process.env.METRICS_TOKEN = randomSecret();

/** Mot de passe valide commun aux utilisateurs de test. */
const PASSWORD = randomSecret();

const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../app');
const { connectDB, disconnectDB } = require('../config/db');

/** Connecte la base de test et la vide. */
async function setup() {
  await connectDB(process.env.MONGO_URI);
  await mongoose.connection.dropDatabase();
}

/** Vide la base de test et ferme la connexion. */
async function teardown() {
  await mongoose.connection.dropDatabase();
  await disconnectDB();
}

/**
 * Crée un utilisateur et renvoie un agent Supertest qui conserve le cookie de session.
 * @param {string} username
 * @returns {Promise<import('supertest').Agent>}
 */
async function loggedInAgent(username) {
  const agent = request.agent(app);
  await agent.post('/api/auth/register').send({ username, password: PASSWORD }).expect(201);
  return agent;
}

module.exports = { app, request, setup, teardown, loggedInAgent, randomSecret, PASSWORD };
