import { useState } from 'react';
import { BASE_URL } from '../api/api';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    if (loading) return;

    setError('');
    setLoading(true);

    try {
      const body = new URLSearchParams({
        action: 'login',
        email: email.trim(),
        password
      });

      const res = await fetch(BASE_URL, {
        method: 'POST',
        body
      });

      const result = await res.json();

      if (!result.success) {
        setError(result.error || 'Login failed');
        return;
      }

      login(result.data);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Unable to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.logo}>📦</div>
          <h1 style={styles.mainTitle}>Stock Management</h1>
          <p style={styles.subtitle}>Inventory Control System</p>
        </div>

        <form onSubmit={handleLogin} style={styles.card}>
          <h2 style={styles.cardTitle}>Sign In</h2>

          <div style={styles.formGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="username"
              required
              placeholder="your@email.com"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              placeholder="Enter your password"
              style={styles.input}
            />
          </div>

          {error && <div style={styles.error}>
            <span style={styles.errorIcon}>⚠️</span>
            {error}
          </div>}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              pointerEvents: loading ? 'none' : 'auto'
            }}
          >
            {loading ? '⏳ Signing in…' : '➜ Sign In'}
          </button>
        </form>

        <p style={styles.footer}>© 2026 Stock Management System</p>
      </div>
    </div>
  );
}

/* ===============================
   Modern PWA-friendly styles
================================ */

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif'
  },
  content: {
    width: '100%',
    maxWidth: 420,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  header: {
    textAlign: 'center',
    marginBottom: 32,
    color: '#fff'
  },
  logo: {
    fontSize: 56,
    marginBottom: 16
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 700,
    margin: '0 0 8px 0',
    letterSpacing: '-0.5px'
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.9,
    margin: 0,
    fontWeight: 400
  },
  card: {
    width: '100%',
    padding: 32,
    borderRadius: 12,
    border: 'none',
    background: '#fff',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
    marginBottom: 24
  },
  cardTitle: {
    marginBottom: 24,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 700,
    color: '#1a1a1a',
    letterSpacing: '-0.3px'
  },
  formGroup: {
    marginBottom: 18
  },
  label: {
    display: 'block',
    marginBottom: 8,
    fontSize: 14,
    fontWeight: 600,
    color: '#2c3e50',
    letterSpacing: '0.2px'
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    marginTop: 6,
    fontSize: 14,
    border: '1px solid #d0d7e0',
    borderRadius: 6,
    background: '#fff',
    color: '#2c3e50',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit'
  },
  button: {
    width: '100%',
    padding: '12px 20px',
    marginTop: 20,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
    letterSpacing: '0.3px'
  },
  error: {
    marginTop: 16,
    padding: 12,
    background: '#ffebee',
    color: '#c62828',
    fontSize: 13,
    borderRadius: 6,
    border: '1px solid #ef5350',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontWeight: 500
  },
  errorIcon: {
    fontSize: 14
  },
  footer: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    margin: 0,
    fontWeight: 400
  }
};
