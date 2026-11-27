/**
 * Garde de routes selon l'état de connexion.
 */
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';

/**
 * Affiche `children` uniquement si l'utilisateur est connecté,
 * sinon redirige vers /login en mémorisant la page demandée.
 * @param {{ children: import('react').ReactNode }} props
 */
export function ProtectedRoute({ children }) {
  const { user, loading, sessionExpired } = useAuth();
  const location = useLocation();

  if (loading) return <p className="loading">Chargement…</p>;
  if (!user) {
    const flash = sessionExpired ? 'Votre session a expiré, veuillez vous reconnecter' : '';
    return <Navigate to="/login" replace state={{ from: location.pathname, flash }} />;
  }
  return children;
}

/**
 * Affiche `children` uniquement si l'utilisateur N'est PAS connecté
 * (pages de connexion / inscription), sinon redirige vers /tasks.
 * @param {{ children: import('react').ReactNode }} props
 */
export function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="loading">Chargement…</p>;
  if (user) return <Navigate to="/tasks" replace />;
  return children;
}
