/**
 * Message de retour à l'utilisateur (succès, erreur, information).
 * Équivalent côté React des messages « flash » : le texte vient
 * généralement du champ `msg` renvoyé par l'API.
 *
 * @param {object} props
 * @param {'success'|'error'|'info'} [props.type='info'] - Style du message.
 * @param {string} props.message - Texte affiché (rien n'est rendu s'il est vide).
 * @param {() => void} [props.onClose] - Affiche un bouton de fermeture si fourni.
 */
export default function Alert({ type = 'info', message, onClose }) {
  if (!message) return null;
  return (
    <div className={`alert alert-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <span>{message}</span>
      {onClose && (
        <button type="button" className="alert-close" onClick={onClose} aria-label="Fermer">
          ×
        </button>
      )}
    </div>
  );
}
