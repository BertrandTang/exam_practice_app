/**
 * Client HTTP de l'API.
 *
 * - L'URL de l'API dépend de l'environnement (VITE_API_URL, fixée au build).
 * - `withCredentials` envoie le cookie de session httpOnly à chaque requête :
 *   le token n'est plus stocké dans localStorage.
 */
import axios from 'axios';

/** URL de base de l'API (ex. https://api.todo.bazardim.fr/api). */
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 10000,
});

/**
 * Extrait un message lisible d'une erreur Axios.
 * @param {unknown} err - Erreur levée par Axios.
 * @param {string} [fallback] - Message par défaut.
 * @returns {string}
 */
export function getErrorMessage(err, fallback = 'Une erreur est survenue, veuillez réessayer') {
  if (err?.response?.data?.msg) return err.response.data.msg;
  if (err?.request && !err.response) return 'Serveur injoignable, vérifiez votre connexion';
  return fallback;
}

export default api;
