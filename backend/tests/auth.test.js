const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { app, request, setup, teardown, randomSecret, PASSWORD } = require('./helpers');

const wrongPassword = randomSecret();
const tooShort = randomSecret().slice(0, 3);

describe('Authentification', () => {
  before(setup);
  after(teardown);

  it('inscrit un utilisateur et pose un cookie httpOnly', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'alice', password: PASSWORD })
      .expect(201);
    assert.equal(res.body.user.username, 'alice');
    assert.equal(res.body.user.password, undefined);
    const cookie = res.headers['set-cookie'][0];
    assert.match(cookie, /^token=/);
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Lax/);
  });

  it('refuse un nom déjà pris (409)', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'alice', password: randomSecret() })
      .expect(409);
  });

  it('refuse un formulaire vide ou un mot de passe trop court (400)', async () => {
    await request(app).post('/api/auth/register').send({}).expect(400);
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'bob', password: tooShort })
      .expect(400);
    assert.match(res.body.msg, /au moins 8 caractères/);
  });

  it('connecte avec les bons identifiants', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'alice', password: PASSWORD })
      .expect(200);
    assert.match(res.headers['set-cookie'][0], /^token=/);
  });

  it('renvoie le même message que le compte existe ou non', async () => {
    const wrongPwd = await request(app)
      .post('/api/auth/login')
      .send({ username: 'alice', password: wrongPassword })
      .expect(400);
    const unknown = await request(app)
      .post('/api/auth/login')
      .send({ username: 'inconnu', password: wrongPassword })
      .expect(400);
    assert.equal(wrongPwd.body.msg, unknown.body.msg);
  });

  it("bloque l'injection d'opérateurs NoSQL", async () => {
    await request(app)
      .post('/api/auth/login')
      .send({ username: { $gt: '' }, password: { $gt: '' } })
      .expect(400);
  });

  it('GET /me : 401 sans session, 200 avec', async () => {
    await request(app).get('/api/auth/me').expect(401);
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ username: 'alice', password: PASSWORD });
    const res = await agent.get('/api/auth/me').expect(200);
    assert.equal(res.body.user.username, 'alice');
  });

  it('refuse un token invalide avec 401 (et plus 418)', async () => {
    await request(app).get('/api/auth/me').set('Cookie', 'token=faux.jwt.token').expect(401);
  });

  it('logout supprime le cookie', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ username: 'alice', password: PASSWORD });
    await agent.post('/api/auth/logout').expect(200);
    await agent.get('/api/auth/me').expect(401);
  });
});
