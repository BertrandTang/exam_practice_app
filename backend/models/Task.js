/**
 * Modèle Mongoose d'une tâche.
 * @module models/Task
 */
const mongoose = require('mongoose');

/**
 * @typedef {object} Task
 * @property {mongoose.Types.ObjectId} user - Propriétaire de la tâche.
 * @property {string} title - Titre (1 à 100 caractères).
 * @property {string} description - Description facultative (500 caractères max).
 * @property {boolean} isCompleted - Tâche terminée ou non.
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */
const TaskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, versionKey: false },
);

module.exports = mongoose.model('Task', TaskSchema);
