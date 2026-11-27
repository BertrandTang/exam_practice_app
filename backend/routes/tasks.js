/**
 * Routes des tâches : /api/tasks
 *
 * Toutes les routes exigent une session (middleware `auth`) et ne
 * manipulent QUE les tâches de l'utilisateur connecté : chaque requête
 * filtre sur `{ _id, user: req.user.id }` (correction de la faille IDOR).
 * @module routes/tasks
 */
const express = require('express');
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const logger = require('../config/logger');
const { createTaskSchema, updateTaskSchema, idParamSchema } = require('../validators/schemas');

const router = express.Router();
router.use(auth);

/**
 * Répond 404 lorsqu'une tâche n'existe pas OU appartient à un autre
 * utilisateur (on ne révèle pas son existence), et journalise la
 * tentative d'accès à la tâche d'un autre.
 * @param {express.Request} req
 * @param {express.Response} res
 * @returns {Promise<express.Response>}
 */
async function notFoundOrForbidden(req, res) {
  const existing = await Task.exists({ _id: req.params.id });
  if (existing) {
    logger.warn('task.access_denied', {
      userId: req.user.id,
      taskId: req.params.id,
      method: req.method,
    });
  }
  return res.status(404).json({ msg: 'Tâche introuvable' });
}

/**
 * GET /api/tasks — Liste les tâches de l'utilisateur, plus récentes d'abord.
 * Réponse : 200 `Task[]`.
 */
router.get('/', async (req, res) => {
  const tasks = await Task.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.json(tasks);
});

/**
 * POST /api/tasks — Crée une tâche.
 * Corps : `{ title, description? }`.
 * Réponses : 201 `Task`, 400 données invalides.
 */
router.post('/', validate(createTaskSchema), async (req, res) => {
  const { title, description } = req.body;
  const task = await Task.create({ title, description, user: req.user.id });
  res.status(201).json(task);
});

/**
 * PUT /api/tasks/:id — Modifie une tâche de l'utilisateur.
 * Corps : au moins un champ parmi `{ title, description, isCompleted }`.
 * Réponses : 200 `Task`, 400 données invalides, 404 introuvable ou non autorisée.
 */
router.put(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(updateTaskSchema),
  async (req, res) => {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: req.body },
      { returnDocument: 'after', runValidators: true },
    );
    if (!task) return notFoundOrForbidden(req, res);
    return res.json(task);
  },
);

/**
 * DELETE /api/tasks/:id — Supprime une tâche de l'utilisateur.
 * Réponses : 200 `{ msg, id }`, 400 identifiant invalide, 404 introuvable ou non autorisée.
 */
router.delete('/:id', validate(idParamSchema, 'params'), async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!task) return notFoundOrForbidden(req, res);
  return res.json({ msg: 'Tâche supprimée', id: task.id });
});

module.exports = router;
