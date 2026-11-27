/**
 * Barre de navigation : liens adaptés à l'état de connexion.
 */
import { Link, NavLink, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true, state: { flash: 'Vous êtes déconnecté' } });
  };

  return (
    <header className="header">
      <Link to="/" className="brand">
        Mes Tâches
      </Link>
      <nav>
        <ul className="nav-list">
          {user ? (
            <>
              <li className="nav-greeting">Bonjour, {user.username}</li>
              <li>
                <NavLink to="/tasks" className="nav-link">
                  Mes tâches
                </NavLink>
              </li>
              <li>
                <button type="button" onClick={handleLogout} className="nav-link nav-button">
                  Déconnexion
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <NavLink to="/login" className="nav-link">
                  Connexion
                </NavLink>
              </li>
              <li>
                <NavLink to="/register" className="nav-link">
                  Inscription
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
}
