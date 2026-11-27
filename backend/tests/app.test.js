const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { app, request, setup, teardown } = require('./helpers');

describe('Application', () => {
  before(setup);
  after(teardown);

  it('GET /health renvoie ok quand MongoDB est connecté', async () => {
    const res = await request(app).get('/health').expect(200);
    assert.equal(res.body.status, 'ok');
    assert.equal(res.body.db, 'up');
  });

  it('GET /metrics exige le jeton', async () => {
    await request(app).get('/metrics').expect(401);
    const res = await request(app)
      .get('/metrics')
      .set('Authorization', `Bearer ${process.env.METRICS_TOKEN}`)
      .expect(200);
    assert.match(res.text, /http_request_duration_seconds/);
  });

  it('renvoie 404 JSON pour une route inconnue', async () => {
    const res = await request(app).get('/api/inexistant').expect(404);
    assert.ok(res.body.msg);
  });

  it('renvoie 400 pour un JSON mal formé', async () => {
    await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"username":')
      .expect(400);
  });

  it('applique les en-têtes de sécurité et un CORS restreint', async () => {
    const res = await request(app).get('/health').set('Origin', 'https://site-malveillant.com');
    assert.equal(res.headers['x-powered-by'], undefined);
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
    assert.equal(res.headers['access-control-allow-origin'], undefined);
  });
});
