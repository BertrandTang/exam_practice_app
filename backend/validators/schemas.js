/**
 * Schémas de validation Joi des entrées utilisateur.
 *
 * Le typage strict des champs bloque aussi l'injection d'opérateurs MongoDB.
 * @module validators/schemas
 */
const Joi = require('joi');

/** Messages d'erreur en français, utilisés par le middleware `validate`. */
const messages = {
  'any.required': '{#label} est obligatoire',
  'string.base': '{#label} doit être une chaîne de caractères',
  'string.empty': '{#label} ne peut pas être vide',
  'string.min': '{#label} doit contenir au moins {#limit} caractères',
  'string.max': '{#label} doit contenir au plus {#limit} caractères',
  'string.pattern.base': '{#label} contient des caractères non autorisés',
  'string.pattern.invert.base': '{#label} ne doit pas contenir de balises HTML',
  'string.hex': '{#label} est invalide',
  'string.length': '{#label} est invalide',
  'boolean.base': '{#label} doit être un booléen',
  'object.min': 'Aucun champ à modifier',
  'object.unknown': "Le champ {#label} n'est pas autorisé",
};

const username = Joi.string()
  .trim()
  .min(3)
  .max(30)
  .pattern(/^[a-zA-Z0-9_.-]+$/)
  .label("Le nom d'utilisateur");

/** Inscription : nom d'utilisateur (3-30, alphanumérique . _ -) et mot de passe (8-72). */
const registerSchema = Joi.object({
  username: username.required(),
  // 72 octets : limite de bcrypt
  password: Joi.string().min(8).max(72).required().label('Le mot de passe'),
});

/** Connexion : deux chaînes obligatoires. */
const loginSchema = Joi.object({
  username: Joi.string().trim().max(30).required().label("Le nom d'utilisateur"),
  password: Joi.string().max(72).required().label('Le mot de passe'),
});

/**
 * Balise HTML (<script>, <img onerror=…>), refusée dans les tâches contre le XSS stocké.
 */
const HTML_TAG = /<\/?[a-z!][^>]*>/i;

const title = Joi.string()
  .trim()
  .min(1)
  .max(100)
  .pattern(HTML_TAG, { invert: true })
  .label('Le titre');
const description = Joi.string()
  .trim()
  .max(500)
  .allow('')
  .pattern(HTML_TAG, { invert: true })
  .label('La description');

/** Création d'une tâche : titre obligatoire, description facultative. */
const createTaskSchema = Joi.object({
  title: title.required(),
  description,
});

/** Modification d'une tâche : au moins un champ parmi titre, description, isCompleted. */
const updateTaskSchema = Joi.object({
  title,
  description,
  isCompleted: Joi.boolean().strict().label('isCompleted'),
}).min(1);

/** Paramètre `:id` : ObjectId MongoDB (24 caractères hexadécimaux). */
const idParamSchema = Joi.object({
  id: Joi.string().hex().length(24).required().label("L'identifiant"),
});

module.exports = {
  messages,
  registerSchema,
  loginSchema,
  createTaskSchema,
  updateTaskSchema,
  idParamSchema,
};
