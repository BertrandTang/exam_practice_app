/**
 * Contexte d'authentification.
 *
 * Le JWT est dans un cookie httpOnly illisible en JavaScript : le front
 * demande donc à l'API qui est connecté (GET /auth/me) au chargement, puis
 * garde l'utilisateur en mémoire. Toute réponse 401 sur une route protégée
 * (session expirée) déconnecte l'utilisateur côté interface.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);

/**
 * Fournit l'état de session à toute l'application.
 * @param {{ children: import('react').ReactNode }} props
 */
export function AuthProvider({ children }) {
  /** Utilisateur connecté `{ id, username }`, ou null. */
  const [user, setUser] = useState(null);
  /** true tant que la session n'a pas été vérifiée auprès de l'API. */
  const [loading, setLoading] = useState(true);
  /** true si la session a expiré pendant l'utilisation. */
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    api
      .get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const id = api.interceptors.response.use(
      (res) => res,
      (err) => {
        const url = err.config?.url ?? '';
        if (err.response?.status === 401 && !url.startsWith('/auth/')) {
          setUser(null);
          setSessionExpired(true);
        }
        return Promise.reject(err);
      },
    );
    return () => api.interceptors.response.eject(id);
  }, []);

  const login = useCallback(async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    setUser(res.data.user);
    setSessionExpired(false);
  }, []);

  const register = useCallback(async (username, password) => {
    const res = await api.post('/auth/register', { username, password });
    setUser(res.data.user);
    setSessionExpired(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, sessionExpired, login, register, logout }),
    [user, loading, sessionExpired, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Accède au contexte d'authentification.
 * @returns {{ user: {id: string, username: string}|null, loading: boolean,
 *   sessionExpired: boolean, login: Function, register: Function, logout: Function }}
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  return ctx;
}
