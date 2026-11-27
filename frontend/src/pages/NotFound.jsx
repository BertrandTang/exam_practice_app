/**
 * Page affichée pour une URL inconnue.
 */
import { Link } from 'react-router';

export default function NotFound() {
  return (
    <div className="container">
      <h1>Page introuvable</h1>
      <p className="empty">
        Cette page n’existe pas. <Link to="/">Retour à l’accueil</Link>
      </p>
    </div>
  );
}
