import { useEffect, useState } from 'react';
import { apiGet } from '../api/api';
import { useAuth } from '../auth/AuthContext';

export default function Materials() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    apiGet('materials', user).then(res => {
      if (!mounted) return;
      if (res.success) setMaterials(res.data);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [user]);

  if (loading) {
    return <div style={styles.center}>Loading materials…</div>;
  }

  if (!materials.length) {
    return <div style={styles.center}>No materials found</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Materials</h2>

      {/* Desktop */}
      <div className="desktop-only">
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Material</th>
              <th>Warehouse</th>
              <th>Stock</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {materials.map(m => (
              <tr key={`${m.material_code}-${m.warehouse_id}`}>
                <td>{m.material_name}</td>
                <td>{m.warehouse_id}</td>
                <td>{m.current_stock}</td>
                <td>
                  <StatusBadge ok={m.stock_ok === 'OK'} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="mobile-only" style={styles.cards}>
        {materials.map(m => (
          <div key={`${m.material_code}-${m.warehouse_id}`} style={styles.card}>
            <strong>{m.material_name}</strong>

            <div style={styles.meta}>Warehouse: {m.warehouse_id}</div>
            <div style={styles.meta}>Stock: {m.current_stock}</div>

            <StatusBadge ok={m.stock_ok === 'OK'} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===============================
   Components
================================ */

function StatusBadge({ ok }) {
  return (
    <span
      style={{
        ...styles.badge,
        background: ok ? '#e8f5e9' : '#ffebee',
        color: ok ? '#2e7d32' : '#c62828'
      }}
    >
      {ok ? 'OK' : 'LOW'}
    </span>
  );
}

/* ===============================
   Styles
================================ */

const styles = {
  container: {
    padding: 16,
    maxWidth: 960,
    margin: '0 auto'
  },
  title: {
    marginBottom: 16
  },
  center: {
    padding: 24,
    textAlign: 'center'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  cards: {
    display: 'grid',
    gap: 12
  },
  card: {
    border: '1px solid #ddd',
    borderRadius: 10,
    padding: 14,
    background: '#fff',
    display: 'grid',
    gap: 6
  },
  meta: {
    fontSize: 14,
    color: '#555'
  },
  badge: {
    marginTop: 6,
    padding: '4px 10px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600,
    width: 'fit-content'
  }
};
