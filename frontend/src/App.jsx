/**
 * Composant racine : fournit le contexte d'authentification et déclare les routes.
 *
 * - /login, /register : réservées aux visiteurs non connectés
 * - /tasks : réservée aux utilisateurs connectés
 * - / : redirige selon l'état de connexion
 */
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import Footer from './components/Footer';
import Header from './components/Header';
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Register from './pages/Register';
import Tasks from './pages/Tasks';

/** Redirige l'accueil vers /tasks ou /login selon la session. */
function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <p className="loading">Chargement…</p>;
  return <Navigate to={user ? '/tasks' : '/login'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<HomeRedirect />} />
              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <Login />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicOnlyRoute>
                    <Register />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/tasks"
                element={
                  <ProtectedRoute>
                    <Tasks />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
