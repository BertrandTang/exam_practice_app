/**
 * Page d'inscription.
 *
 * Mêmes règles de validation que l'API, puis connexion automatique.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { getErrorMessage } from '../api';
import Alert from '../components/Alert';
import { useAuth } from '../context/AuthContext';

const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]{3,30}$/;

/**
 * Vérifie le formulaire côté client.
 * @returns {string} Message d'erreur, ou chaîne vide si tout est valide.
 */
function validateForm(username, password, confirm) {
  if (!USERNAME_PATTERN.test(username)) {
    return 'Le nom d’utilisateur doit contenir 3 à 30 caractères (lettres, chiffres, . _ -)';
  }
  if (password.length < 8 || password.length > 72) {
    return 'Le mot de passe doit contenir entre 8 et 72 caractères';
  }
  if (password !== confirm) {
    return 'Les mots de passe ne correspondent pas';
  }
  return '';
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanUsername = username.trim();
    const validationError = validateForm(cleanUsername, password, confirm);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await register(cleanUsername, password);
      navigate('/tasks', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Inscription impossible'));
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <h1>Inscription</h1>
      <Alert type="error" message={error} onClose={() => setError('')} />
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="register-username">Nom d’utilisateur</label>
          <input
            id="register-username"
            type="text"
            autoComplete="username"
            value={username}
            maxLength={30}
            required
            onChange={(e) => setUsername(e.target.value)}
          />
          <small>3 à 30 caractères : lettres, chiffres, . _ -</small>
        </div>
        <div className="form-group">
          <label htmlFor="register-password">Mot de passe</label>
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            value={password}
            maxLength={72}
            required
            onChange={(e) => setPassword(e.target.value)}
          />
          <small>8 caractères minimum</small>
        </div>
        <div className="form-group">
          <label htmlFor="register-confirm">Confirmer le mot de passe</label>
          <input
            id="register-confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            maxLength={72}
            required
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? 'Création…' : 'Créer mon compte'}
        </button>
      </form>
      <p className="form-footer">
        Déjà un compte ? <Link to="/login">Se connecter</Link>
      </p>
    </div>
  );
}
