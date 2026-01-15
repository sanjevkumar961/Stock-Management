// App.js
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';

import Login from './pages/login';
import Materials from './pages/Materials';
import Transactions from './pages/Transactions';
import NewTransaction from './pages/NewTransaction';

/* ===============================
   Route Guards
================================ */

function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RequireManager({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'manager') return <Navigate to="/" replace />;
  return children;
}

/* ===============================
   Layout
================================ */

function Layout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div>
      <header style={{ padding: 12, borderBottom: '1px solid #ddd' }}>
        <strong>Inventory System</strong>
        {user && (
          <span style={{ float: 'right' }}>
            {user.email} | <button onClick={logout}>Logout</button>
          </span>
        )}
      </header>

      <main style={{ padding: 16 }}>{children}</main>
    </div>
  );
}

/* ===============================
   App Entry
================================ */

export default function App() {
  return (
      <AuthProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<Login />} />

              {/* Authenticated */}
              <Route
                path="/"
                element={
                  <RequireAuth>
                    <Materials />
                  </RequireAuth>
                }
              />

              {/* Manager-only */}
              <Route
                path="/transactions"
                element={
                  <RequireManager>
                    <Transactions />
                  </RequireManager>
                }
              />

              <Route
                path="/new"
                element={
                  <RequireManager>
                    <NewTransaction />
                  </RequireManager>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </AuthProvider>
  );
}
