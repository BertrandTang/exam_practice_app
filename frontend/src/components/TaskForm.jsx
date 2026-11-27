/**
 * Formulaire de création d'une tâche (titre obligatoire, description facultative).
 *
 * La tâche créée est transmise au parent via `onAdd`.
 *
 * @param {object} props
 * @param {(task: object) => void} props.onAdd - Appelée avec la tâche créée.
 */
import { useState } from 'react';
import api, { getErrorMessage } from '../api';
import Alert from './Alert';

export const TITLE_MAX = 100;
export const DESCRIPTION_MAX = 500;

export default function TaskForm({ onAdd }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('Le titre ne peut pas être vide');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/tasks', {
        title: cleanTitle,
        description: description.trim(),
      });
      onAdd(res.data);
      setTitle('');
      setDescription('');
    } catch (err) {
      setError(getErrorMessage(err, 'Impossible d’ajouter la tâche'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="task-form" noValidate>
      <Alert type="error" message={error} onClose={() => setError('')} />
      <div className="form-group">
        <label htmlFor="task-title">Titre</label>
        <input
          id="task-title"
          type="text"
          placeholder="Ajouter une tâche…"
          value={title}
          maxLength={TITLE_MAX}
          required
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="task-description">Description (facultative)</label>
        <textarea
          id="task-description"
          rows={2}
          value={description}
          maxLength={DESCRIPTION_MAX}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <button type="submit" className="btn" disabled={submitting}>
        {submitting ? 'Ajout…' : 'Ajouter la tâche'}
      </button>
    </form>
  );
}
