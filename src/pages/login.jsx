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
      <form onSubmit={handleLogin} style={styles.card}>
        <h2 style={styles.title}>Inventory Login</h2>

        <label style={styles.label}>
          Email
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="username"
            required
            style={styles.input}
          />
        </label>

        <label style={styles.label}>
          Password
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            style={styles.input}
          />
        </label>

        {error && <div style={styles.error}>{error}</div>}

        <button
          type="submit"
          disabled={loading}
          style={{
            ...styles.button,
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Signing in…' : 'Login'}
        </button>
      </form>
    </div>
  );
}

/* ===============================
   Minimal PWA-friendly styles
================================ */

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16
  },
  card: {
    width: '100%',
    maxWidth: 360,
    padding: 24,
    borderRadius: 8,
    border: '1px solid #ddd',
    background: '#fff'
  },
  title: {
    marginBottom: 20,
    textAlign: 'center'
  },
  label: {
    display: 'block',
    marginBottom: 12,
    fontSize: 14
  },
  input: {
    width: '100%',
    padding: 8,
    marginTop: 4,
    fontSize: 14
  },
  button: {
    width: '100%',
    padding: 10,
    marginTop: 16,
    fontSize: 15,
    cursor: 'pointer'
  },
  error: {
    marginTop: 8,
    color: '#c62828',
    fontSize: 13
  }
};
