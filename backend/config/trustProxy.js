/**
 * Lecture de TRUST_PROXY pour le réglage `trust proxy` d'Express.
 * @module config/trustProxy
 */

/**
 * Convertit TRUST_PROXY en valeur acceptée par `app.set('trust proxy', …)`.
 *
 * - vide : 0 (aucun proxy, req.ip = adresse de la connexion) ;
 * - nombre : nombre de proxys de confiance ;
 * - liste séparée par des virgules : adresses, plages CIDR ou mots-clés Express
 *   (`loopback`, `uniquelocal`…). req.ip est alors la première adresse non fiable
 *   en partant de la droite de X-Forwarded-For : une valeur ajoutée par le client
 *   (à gauche) ne peut pas usurper son IP.
 *
 * @param {string|undefined} value
 * @returns {number|string[]}
 */
function parseTrustProxy(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return 0;
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  return trimmed
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

module.exports = { parseTrustProxy };
