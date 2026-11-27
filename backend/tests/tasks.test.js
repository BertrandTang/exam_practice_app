const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { app, request, setup, teardown, loggedInAgent } = require('./helpers');

describe('Tâches', () => {
  let alice;
  let bob;
  let aliceTaskId;

  before(async () => {
    await setup();
    alice = await loggedInAgent('alice');
    bob = await loggedInAgent('bob');
  });
  after(teardown);

  it('refuse les requêtes sans session (401)', async () => {
    await request(app).get('/api/tasks').expect(401);
  });

  it('crée une tâche (201) et nettoie les espaces', async () => {
    const res = await alice
      .post('/api/tasks')
      .send({ title: '  Acheter du pain  ', description: 'boulangerie' })
      .expect(201);
    assert.equal(res.body.title, 'Acheter du pain');
    assert.equal(res.body.isCompleted, false);
    aliceTaskId = res.body._id;
  });

  it('refuse un titre vide ou composé d’espaces (400, plus 500)', async () => {
    await alice.post('/api/tasks').send({}).expect(400);
    await alice.post('/api/tasks').send({ title: '   ' }).expect(400);
  });

  it('refuse un titre trop long et les champs inconnus (400)', async () => {
    await alice
      .post('/api/tasks')
      .send({ title: 'a'.repeat(101) })
      .expect(400);
    await alice.post('/api/tasks').send({ title: 'ok', user: 'hack' }).expect(400);
  });

  it('refuse les balises HTML / JavaScript (XSS stocké)', async () => {
    const res = await alice
      .post('/api/tasks')
      .send({ title: "<script>alert('test')</script>" })
      .expect(400);
    assert.match(res.body.msg, /balises HTML/);
    await alice
      .post('/api/tasks')
      .send({ title: 'ok', description: '<img src=x onerror=alert(1)>' })
      .expect(400);
    // Les comparaisons mathématiques restent autorisées
    await alice.post('/api/tasks').send({ title: 'Vérifier que 2 < 3 et 5 > 4' }).expect(201);
    await alice.delete('/api/tasks/' + (await alice.get('/api/tasks')).body[0]._id).expect(200);
  });

  it('liste uniquement les tâches de l’utilisateur', async () => {
    const aliceList = await alice.get('/api/tasks').expect(200);
    const bobList = await bob.get('/api/tasks').expect(200);
    assert.equal(aliceList.body.length, 1);
    assert.equal(bobList.body.length, 0);
  });

  it('modifie une tâche (titre, isCompleted)', async () => {
    const res = await alice
      .put(`/api/tasks/${aliceTaskId}`)
      .send({ isCompleted: true, title: 'Pain acheté' })
      .expect(200);
    assert.equal(res.body.isCompleted, true);
    assert.equal(res.body.title, 'Pain acheté');
  });

  it('refuse une modification invalide (400)', async () => {
    await alice.put(`/api/tasks/${aliceTaskId}`).send({}).expect(400);
    await alice.put(`/api/tasks/${aliceTaskId}`).send({ title: null }).expect(400);
    await alice.put(`/api/tasks/${aliceTaskId}`).send({ isCompleted: 'oui' }).expect(400);
  });

  it('renvoie 400 pour un identifiant mal formé (plus 500)', async () => {
    await alice.put('/api/tasks/123').send({ title: 'x' }).expect(400);
    await alice.delete('/api/tasks/pas-un-id').expect(400);
  });

  it('IDOR : bob ne peut ni modifier ni supprimer la tâche d’alice', async () => {
    await bob.put(`/api/tasks/${aliceTaskId}`).send({ title: 'piraté' }).expect(404);
    await bob.delete(`/api/tasks/${aliceTaskId}`).expect(404);
    const list = await alice.get('/api/tasks').expect(200);
    assert.equal(list.body.length, 1);
    assert.equal(list.body[0].title, 'Pain acheté');
  });

  it('supprime sa propre tâche', async () => {
    await alice.delete(`/api/tasks/${aliceTaskId}`).expect(200);
    await alice.delete(`/api/tasks/${aliceTaskId}`).expect(404);
  });
});
