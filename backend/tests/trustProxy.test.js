const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');
const { parseTrustProxy } = require('../config/trustProxy');

/** Mini-application qui renvoie req.ip avec le réglage donné. */
function appWith(trustProxy) {
  const app = express();
  app.set('trust proxy', trustProxy);
  app.get('/ip', (req, res) => res.send(req.ip));
  return app;
}

describe('TRUST_PROXY', () => {
  it('lit un nombre, une liste ou une valeur vide', () => {
    assert.equal(parseTrustProxy(undefined), 0);
    assert.equal(parseTrustProxy(' 2 '), 2);
    assert.deepEqual(parseTrustProxy('uniquelocal, 162.158.0.0/15'), [
      'uniquelocal',
      '162.158.0.0/15',
    ]);
  });

  it("retrouve l'IP du client derrière une chaîne de proxys de confiance", async () => {
    const app = appWith(parseTrustProxy('loopback, uniquelocal, 162.158.0.0/15, 74.220.48.0/24'));
    // Chaîne observée sur Render via le relais du frontend (IP client : 203.0.113.7).
    const res = await request(app)
      .get('/ip')
      .set('X-Forwarded-For', '203.0.113.7, 162.158.42.22, 74.220.48.7, 162.158.1.1, 10.27.147.13');
    assert.equal(res.text, '203.0.113.7');
  });

  it("ignore une adresse usurpée ajoutée par le client à gauche de l'en-tête", async () => {
    const app = appWith(parseTrustProxy('loopback, uniquelocal, 162.158.0.0/15'));
    const res = await request(app)
      .get('/ip')
      .set('X-Forwarded-For', '1.2.3.4, 203.0.113.7, 162.158.42.22, 10.27.147.13');
    assert.equal(res.text, '203.0.113.7');
  });
});
