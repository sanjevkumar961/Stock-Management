import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { ToastProvider } from './component/ToastContext';
import './App.css';

import Login from './pages/login';
import Materials from './pages/Materials';
import Transactions from './pages/Transactions';
import NewTransaction from './pages/NewTransaction';
import TransferStock from './pages/TransferStock';
import ReprintDC from './pages/ReprintDC';


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
    <div style={styles.appContainer}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.brand}>
            <span style={styles.brandIcon}>📦</span>
            <span>Stock Management</span>
          </div>

          {user && (
            <>
              {menuOpen && (
                <button
                  className="hamburger-btn"
                  style={styles.hamburger}
                  onClick={() => setMenuOpen(false)}
                  title="Close Menu"
                >
                  ✕
                </button>
              )}

              {!menuOpen && (
                <button
                  className="hamburger-btn"
                  style={styles.hamburger}
                  onClick={() => setMenuOpen(true)}
                  title="Open Menu"
                >
                  ☰
                </button>
              )}

              <nav
                style={{
                  ...styles.nav,
                  ...(menuOpen ? styles.navMobileOpen : {display: 'none'}),
                }}
              >
                <NavLink to="/" style={({ isActive }) => navStyle(isActive)} onClick={() => setMenuOpen(false)}>
                  📚 Home
                </NavLink>
                <NavLink to="/new" style={({ isActive }) => navStyle(isActive)} onClick={() => setMenuOpen(false)}>
                  ➕ New
                </NavLink>
                <NavLink to="/transfer" style={({ isActive }) => navStyle(isActive)} onClick={() => setMenuOpen(false)}>
                  🔄 Transfer
                </NavLink>
                {user.role === 'manager' && (
                  <>
                    <NavLink to="/transactions" style={({ isActive }) => navStyle(isActive)} onClick={() => setMenuOpen(false)}>
                      💳 Transactions
                    </NavLink>
                    <NavLink to="/reprintdc" style={({ isActive }) => navStyle(isActive)} onClick={() => setMenuOpen(false)}>
                      📄 Reprint
                    </NavLink>
                  </>
                )}
              </nav>

              <div style={styles.user}>
                <span style={styles.userEmail}>👤 {user.email}</span>
                <button onClick={logout} style={styles.logout}>
                  🚪 Logout
                </button>
              </div>
            </>
          )}
        </div>
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
              <Route
                path="/reprintdc"
                element={
                  <RequireManager>
                    <ReprintDC />
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
  appContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#f5f7fa'
  },
  header: {
    background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
    color: '#fff',
    padding: '0',
    borderBottom: '3px solid #e74c3c',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif'
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    maxWidth: '100%',
    flexWrap: 'wrap',
    position: 'relative',
    gap: 12
  },
  brand: {
    fontWeight: 700,
    fontSize: 18,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    letterSpacing: '-0.3px',
    flexShrink: 0,
    minWidth: 'auto'
  },
  brandIcon: {
    fontSize: 24,
    display: 'flex',
    alignItems: 'center'
  },
  nav: {
    display: 'flex',
    gap: 4,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  navMobileOpen: {
    flexDirection: 'column',
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
    padding: '12px 16px',
    borderBottom: '2px solid #e74c3c',
    zIndex: 10,
    gap: 8,
    marginLeft: 0,
    width: '100%',
    boxSizing: 'border-box'
  },
  hamburger: {
    display: 'none',
    fontSize: 24,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#fff',
    transition: 'transform 0.3s ease',
    padding: '4px 8px',
    flexShrink: 0,
    margin: '0 auto 0 auto'
  },
  user: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: 14,
    fontWeight: 500,
    flexWrap: 'nowrap',
    flexShrink: 0
  },
  userEmail: {
    padding: '6px 12px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: 6,
    whiteSpace: 'nowrap'
  },
  logout: {
    padding: '8px 16px',
    cursor: 'pointer',
    background: '#e74c3c',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontWeight: 600,
    transition: 'all 0.3s ease',
    fontSize: 13,
    whiteSpace: 'nowrap'
  },
  main: {
    flex: 1,
    padding: 0,
    background: '#f5f7fa'
  }
};

function navStyle(active) {
  return {
    textDecoration: 'none',
    fontWeight: 600,
    padding: '8px 14px',
    borderRadius: 6,
    color: active ? '#fff' : 'rgba(255,255,255,0.8)',
    background: active ? 'rgba(231, 76, 60, 0.3)' : 'transparent',
    transition: 'all 0.3s ease',
    border: active ? '1px solid #e74c3c' : '1px solid transparent',
    fontSize: 13,
    display: 'inline-block'
  };
}
