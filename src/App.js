import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { ToastProvider } from './component/ToastContext';

import Login from './pages/login';
import Materials from './pages/Materials';
import Transactions from './pages/Transactions';
import NewTransaction from './pages/NewTransaction';
import TransferStock from './pages/TransferStock';


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

function Layout({ children }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div>
      <header style={styles.header}>
        <div style={styles.brand}>Inventory System</div>

        {user && (
          <>
            <button
              style={styles.hamburger}
              onClick={() => setMenuOpen(prev => !prev)}
            >
              ☰
            </button>

            <nav
              style={{
                ...styles.nav,
                ...(menuOpen ? styles.navMobileOpen : {}),
              }}
            >
              <NavLink to="/" style={({ isActive }) => navStyle(isActive)} onClick={() => setMenuOpen(false)}>
                Home
              </NavLink>
              <NavLink to="/new" style={({ isActive }) => navStyle(isActive)} onClick={() => setMenuOpen(false)}>
                New Transaction
              </NavLink>
              <NavLink to="/transfer" style={({ isActive }) => navStyle(isActive)} onClick={() => setMenuOpen(false)}>
                Transfer Stock
              </NavLink>
              {user.role === 'manager' && (
                <NavLink to="/transactions" style={({ isActive }) => navStyle(isActive)} onClick={() => setMenuOpen(false)}>
                  Transactions
                </NavLink>
              )}
            </nav>

            <div style={styles.user}>
              <span>{user.email}</span>
              <button onClick={logout} style={styles.logout}>
                Logout
              </button>
            </div>
          </>
        )}
      </header>

      <main style={styles.main}>{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <RequireAuth>
                    <Materials />
                  </RequireAuth>
                }
              />
              <Route
                path="/new"
                element={
                  <RequireAuth>
                    <NewTransaction />
                  </RequireAuth>
                }
              />
              <Route
                path="/transfer"
                element={
                  <RequireAuth>
                    <TransferStock />
                  </RequireAuth>
                }
              />
              <Route
                path="/transactions"
                element={
                  <RequireManager>
                    <Transactions />
                  </RequireManager>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

/* ===============================
   Styles
================================ */
const styles = {
  header: {
    padding: '12px 16px',
    borderBottom: '1px solid #ddd',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    position: 'relative'
  },
  brand: { fontWeight: 700, fontSize: 16 },
  nav: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
  },
  navMobileOpen: {
    flexDirection: 'column',
    position: 'absolute',
    top: '60px',
    left: 0,
    right: 0,
    background: '#fff',
    padding: '12px 16px',
    borderBottom: '1px solid #ddd',
    zIndex: 10
  },
  hamburger: {
    display: 'none',
    fontSize: 24,
    background: 'none',
    border: 'none',
    cursor: 'pointer'
  },
  user: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 },
  logout: { padding: '4px 8px', cursor: 'pointer' },
  main: { padding: 16 }
};

function navStyle(active) {
  return {
    textDecoration: 'none',
    fontWeight: 600,
    padding: '6px 10px',
    borderRadius: 6,
    color: active ? '#1976d2' : '#333',
    background: active ? '#e3f2fd' : 'transparent'
  };
}

/* ===============================
   Responsive Media Query
================================ */
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @media (max-width: 768px) {
      nav {
        display: none;
      }
      button[style*="hamburger"] {
        display: block;
      }
    }
    @media (min-width: 769px) {
      nav {
        display: flex !important;
        position: static !important;
        flex-direction: row !important;
      }
      button[style*="hamburger"] {
        display: none !important;
      }
    }
  `;
  document.head.appendChild(style);
}
