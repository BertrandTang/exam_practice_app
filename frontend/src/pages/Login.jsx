/**
 * Page de connexion.
 *
 * Après connexion, redirige vers la page demandée initialement.
 */
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { getErrorMessage } from '../api';
import Alert from '../components/Alert';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  // Message transmis par la navigation (déconnexion, session expirée),
  // masqué une fois fermé ou après une tentative de connexion.
  const [dismissedKey, setDismissedKey] = useState(null);
  const flash = dismissedKey === location.key ? '' : (location.state?.flash ?? '');
  const hideFlash = () => setDismissedKey(location.key);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    hideFlash();
    if (!username.trim() || !password) {
      setError('Veuillez renseigner le nom d’utilisateur et le mot de passe');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await login(username.trim(), password);
      navigate(location.state?.from || '/tasks', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Connexion impossible'));
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <h1>Connexion</h1>
      <Alert type="info" message={flash} onClose={hideFlash} />
      <Alert type="error" message={error} onClose={() => setError('')} />
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="login-username">Nom d’utilisateur</label>
          <input
            id="login-username"
            type="text"
            autoComplete="username"
            value={username}
            maxLength={30}
            required
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="login-password">Mot de passe</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            maxLength={72}
            required
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
      <p className="form-footer">
        Pas encore de compte ? <Link to="/register">Créer un compte</Link>
      </p>
    </div>
  );
}
