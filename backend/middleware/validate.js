/**
 * Middleware de validation des requêtes avec Joi.
 * @module middleware/validate
 */
const { messages } = require('../validators/schemas');

/**
 * Crée un middleware qui valide `req[source]` avec un schéma Joi.
 * En cas d'erreur, répond 400 avec le premier message ; sinon remplace
 * les données par leur version nettoyée (trim, champs inconnus refusés).
 *
 * @param {Joi.ObjectSchema} schema - Schéma Joi à appliquer.
 * @param {'body'|'params'} [source='body'] - Partie de la requête à valider.
 * @returns {express.RequestHandler}
 * @example
 * router.post('/', validate(createTaskSchema), handler);
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source] ?? {}, {
      abortEarly: true,
      messages,
      errors: { wrap: { label: false } },
    });
    if (error) {
      return res.status(400).json({ msg: error.details[0].message });
    }
    if (source === 'body') {
      req.body = value;
    } else {
      // Express 5 : req.params est réassignable, req.query ne l'est pas.
      req.params = value;
    }
    return next();
  };
}

module.exports = validate;
