/**
 * Page « Mes tâches » (route protégée).
 *
 * La liste est mise à jour localement après chaque action, sans rechargement.
 */
import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api';
import Alert from '../components/Alert';
import TaskForm from '../components/TaskForm';
import TaskItem from '../components/TaskItem';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: 'info', text: '' });

  const notify = (type, text) => setMessage({ type, text });

  useEffect(() => {
    let cancelled = false;
    api
      .get('/tasks')
      .then((res) => {
        if (!cancelled) setTasks(res.data);
      })
      .catch((err) => {
        if (!cancelled) notify('error', getErrorMessage(err, 'Impossible de charger les tâches'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const addTask = useCallback((task) => {
    setTasks((prev) => [task, ...prev]);
    notify('success', 'Tâche ajoutée');
  }, []);

  const updateTask = useCallback(async (id, changes) => {
    try {
      const res = await api.put(`/tasks/${id}`, changes);
      setTasks((prev) => prev.map((t) => (t._id === id ? res.data : t)));
      notify('info', '');
    } catch (err) {
      notify('error', getErrorMessage(err, 'Impossible de modifier la tâche'));
      throw err;
    }
  }, []);

  const deleteTask = useCallback(async (id) => {
    try {
      await api.delete(`/tasks/${id}`);
      setTasks((prev) => prev.filter((t) => t._id !== id));
      notify('success', 'Tâche supprimée');
    } catch (err) {
      notify('error', getErrorMessage(err, 'Impossible de supprimer la tâche'));
    }
  }, []);

  const remaining = tasks.filter((t) => !t.isCompleted).length;

  return (
    <div className="container">
      <h1>Mes tâches</h1>
      <Alert type={message.type} message={message.text} onClose={() => notify('info', '')} />
      <TaskForm onAdd={addTask} />

      {loading ? (
        <p className="loading">Chargement des tâches…</p>
      ) : tasks.length === 0 ? (
        <p className="empty">Aucune tâche pour le moment.</p>
      ) : (
        <>
          <p className="task-count">
            {remaining} tâche{remaining > 1 ? 's' : ''} restante{remaining > 1 ? 's' : ''} sur{' '}
            {tasks.length}
          </p>
          <ul className="task-list">
            {tasks.map((task) => (
              <TaskItem key={task._id} task={task} onUpdate={updateTask} onDelete={deleteTask} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
