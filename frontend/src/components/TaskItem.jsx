/**
 * Une tâche de la liste : case « terminée », modification du titre et
 * de la description, suppression (avec confirmation).
 *
 * @param {object} props
 * @param {{ _id: string, title: string, description?: string, isCompleted: boolean }} props.task
 * @param {(id: string, changes: object) => Promise<void>} props.onUpdate - Envoie une modification.
 * @param {(id: string) => Promise<void>} props.onDelete - Supprime la tâche.
 */
import { useState } from 'react';
import { DESCRIPTION_MAX, TITLE_MAX } from './TaskForm';

export default function TaskItem({ task, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [busy, setBusy] = useState(false);

  /**
   * Exécute une action en désactivant les boutons pendant l'appel API.
   * Les erreurs sont déjà affichées par la page parente.
   */
  const run = async (action) => {
    setBusy(true);
    try {
      await action();
    } catch {
      // message d'erreur affiché par la page Tasks
    } finally {
      setBusy(false);
    }
  };

  const startEditing = () => {
    setTitle(task.title);
    setDescription(task.description ?? '');
    setEditing(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    run(async () => {
      await onUpdate(task._id, { title: title.trim(), description: description.trim() });
      setEditing(false);
    });
  };

  const handleDelete = () => {
    if (window.confirm(`Supprimer la tâche « ${task.title} » ?`)) {
      run(() => onDelete(task._id));
    }
  };

  if (editing) {
    return (
      <li className="task-item editing">
        <form onSubmit={handleSave} className="task-edit">
          <input
            type="text"
            aria-label="Titre"
            value={title}
            maxLength={TITLE_MAX}
            required
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            aria-label="Description"
            rows={2}
            value={description}
            maxLength={DESCRIPTION_MAX}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="task-actions">
            <button
              type="submit"
              className="btn-small btn-primary"
              disabled={busy || !title.trim()}
            >
              Enregistrer
            </button>
            <button type="button" className="btn-small" onClick={() => setEditing(false)}>
              Annuler
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className={`task-item ${task.isCompleted ? 'completed' : ''}`}>
      <label className="task-main">
        <input
          type="checkbox"
          checked={task.isCompleted}
          disabled={busy}
          onChange={() => run(() => onUpdate(task._id, { isCompleted: !task.isCompleted }))}
        />
        <span className="task-text">
          <span className="task-title">{task.title}</span>
          {task.description && <span className="task-description">{task.description}</span>}
        </span>
      </label>
      <div className="task-actions">
        <button type="button" className="btn-small" onClick={startEditing} disabled={busy}>
          Modifier
        </button>
        <button
          type="button"
          className="btn-small btn-danger"
          onClick={handleDelete}
          disabled={busy}
        >
          Supprimer
        </button>
      </div>
    </li>
  );
}
