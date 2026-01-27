import { useEffect, useState, useMemo } from 'react';
import { apiGet } from '../api/api';
import { useAuth } from '../auth/AuthContext';

export default function Materials() {
  const { user, logout } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      apiGet('warehouses', user, logout),
      apiGet('materials', user, logout)
    ]).then(([whRes, matRes]) => {
      if (!mounted) return;

      if (whRes.success) setWarehouses(whRes.data);

      if (matRes.success) {
        const map = new Map();
        matRes.data.forEach(m => {
          if (!map.has(m.material_code)) map.set(m.material_code, m);
        });
        setMaterials([...map.values()]);
      }      

      setLoading(false);
    });

    return () => (mounted = false);
  }, [user, logout]);

  /* ===============================
     Derived Data
  ================================ */
  const rowsWithWarehouseName = useMemo(() => {
    if (!warehouses.length || !materials.length) return [];
    return materials.map(r => ({
      ...r,
      warehouse_name:
        warehouses.find(w => w.warehouse_id === r.warehouse_id)
          ?.warehouse_name || r.warehouse_id
    }));
  }, [warehouses, materials]);

  if (loading) {
    return <div style={styles.center}>Loading materials…</div>;
  }

  if (!materials.length) {
    return <div style={styles.center}>No materials found</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📦 Materials Inventory</h2>

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
            {rowsWithWarehouseName.map(m => (
              <tr key={`${m.material_code}-${m.warehouse_id}`}>
                <td>{m.material_name}</td>
                <td>{m.warehouse_name}</td>
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
      <div className="mobile-only">
        {rowsWithWarehouseName.map(m => (
          <div key={`${m.material_code}-${m.warehouse_id}`} style={styles.card}>
            <strong style={{ fontSize: 16, color: '#1a1a1a' }}>{m.material_name}</strong>

            <div style={styles.meta}>📍 {m.warehouse_name}</div>
            <div style={styles.meta}>📦 Stock: <strong style={{ color: '#2c3e50' }}>{m.current_stock}</strong></div>

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
        background: ok ? '#d4edda' : '#f8d7da',
        color: ok ? '#155724' : '#721c24',
        border: `1px solid ${ok ? '#c3e6cb' : '#f5c6cb'}`
      }}
    >
      {ok ? '✓ OK' : '⚠ LOW'}
    </span>
  );
}

/* ===============================
   Styles
================================ */

const styles = {
  container: {
    padding: '24px',
    maxWidth: 1200,
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif'
  },
  title: {
    marginBottom: 24,
    fontSize: 32,
    fontWeight: 700,
    color: '#1a1a1a',
    letterSpacing: '-0.5px'
  },
  center: {
    padding: 48,
    textAlign: 'center',
    fontSize: 16,
    color: '#666'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
  },
  cards: {
    display: 'grid',
    gap: 16
  },
  card: {
    border: '1px solid #e0e0e0',
    borderRadius: 12,
    padding: 18,
    background: '#fff',
    display: 'grid',
    gap: 10,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    transition: 'all 0.3s ease',
    cursor: 'pointer'
  },
  meta: {
    fontSize: 14,
    color: '#666',
    fontWeight: 500
  },
  badge: {
    marginTop: 8,
    padding: '6px 14px',
    borderRadius: 14,
    fontSize: 12,
    fontWeight: 700,
    width: 'fit-content',
    letterSpacing: '0.3px'
  }
};
