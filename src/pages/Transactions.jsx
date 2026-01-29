import { useEffect, useState, useMemo } from 'react';
import { apiGet } from '../api/api';
import { useAuth } from '../auth/AuthContext';

export default function Transactions() {
  const { user, logout } = useAuth();
  const [rows, setRows] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ===============================
     Data Load
  ================================ */
  useEffect(() => {
    let mounted = true;

    Promise.all([
      apiGet('transactions', user, logout),
      apiGet('materials', user, logout),
      apiGet('warehouses', user, logout)
    ]).then(([txRes, matRes, whRes]) => {
      if (!mounted) return;

      if (txRes.success) setRows(txRes.data);

      if (matRes.success) {
        const map = new Map();
        matRes.data.forEach(m => {
          if (!map.has(m.material_code)) map.set(m.material_code, m);
        });
        setMaterials([...map.values()]);
      }

      if (whRes.success) {
        const map = new Map();
        whRes.data.forEach(w => {
          if (!map.has(w.warehouse_id)) map.set(w.warehouse_id, w);
        });
        setWarehouses([...map.values()]);
      }

      setLoading(false);
    });

    return () => (mounted = false);
  }, [user, logout]);

  /* ===============================
     Derived Data
  ================================ */
  const rowsWithName = useMemo(() => {
    if (!rows.length || !materials.length || !warehouses.length) return [];
    return rows.map(r => ({
      ...r,
      material_name:
        materials.find(m => m.material_code === r.material_code)
          ?.material_name || r.material_code,
      from_warehouse_name:
        warehouses.find(w => w.warehouse_id === r.from_warehouse)
          ?.warehouse_name || r.from_warehouse,
      to_warehouse_name:
        warehouses.find(w => w.warehouse_id === r.to_warehouse)
          ?.warehouse_name || r.to_warehouse
    }));
  }, [rows, materials, warehouses]);

  if (loading) {
    return <div style={styles.center}>Loading transactions…</div>;
  }

  if (!rowsWithName.length) {
    return <div style={styles.center}>No transactions found</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>💳 Transactions Log</h2>

      {/* Desktop Table */}
      <div className="desktop-only" style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Material</th>
              <th>Qty</th>
              <th>Type</th>
              <th>From</th>
              <th>To</th>
              <th>User</th>
              <th>Date</th>
              <th>DC NO</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {rowsWithName.map(t => (
              <tr key={t.txn_id}>
                <td>{t.txn_id}</td>
                <td>{t.material_name}</td>
                <td>{t.quantity}</td>
                <td>{formatType(t.type)}</td>
                <td>{t.from_warehouse_name || '-'}</td>
                <td>{t.to_warehouse_name || '-'}</td>
                <td>{t.user_email}</td>
                <td>{formatDate(t.timestamp)}</td>
                <td>{t.dc_no || '-'}</td>
                <td>{t.remarks || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="mobile-only">
        {rowsWithName.map(t => (
          <div key={t.txn_id} style={styles.card}>
            <div style={styles.cardHeader}>
              <strong style={{ fontSize: 16, color: '#1a1a1a' }}>{t.material_name}</strong>
              <span style={styles.qty}>Qty: {t.quantity}</span>
            </div>

            <div style={styles.row}>📤 Type: <strong>{formatType(t.type)}</strong></div>
            {t.from_warehouse_name && (<div style={styles.row}>📍 From: {t.from_warehouse_name}</div>)}
            <div style={styles.row}>📌 To: {t.to_warehouse_name || '-'}</div>
            <div style={styles.row}>👤 User: {t.user_email}</div>
            <div style={styles.row}>📅 {formatDate(t.timestamp)}</div>
            {t.dc_no && (<div style={styles.row}>📋 DC NO: <strong>{t.dc_no}</strong></div>)}
            {t.remarks && (<div style={styles.remarks}>💬 {t.remarks}</div>)}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===============================
   Helpers
================================ */
function formatDate(v) {
  if (!v) return '';
  return new Date(v).toLocaleString();
}

function formatType(t) {
  return t.replace(/_/g, ' ').toUpperCase();
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

  tableWrapper: {
    overflowX: 'auto',
    borderRadius: 8,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    background: '#fff'
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
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    transition: 'all 0.3s ease',
    cursor: 'pointer'
  },

  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottom: '1px solid #f0f0f0'
  },

  qty: {
    fontWeight: 700,
    background: '#f0f4f8',
    color: '#2c3e50',
    padding: '6px 12px',
    borderRadius: 8,
    fontSize: 13
  },

  row: {
    fontSize: 14,
    marginBottom: 8,
    color: '#34495e',
    lineHeight: 1.5
  },

  remarks: {
    marginTop: 12,
    fontSize: 13,
    fontStyle: 'italic',
    color: '#7f8c8d',
    padding: '10px',
    background: '#f8f9fa',
    borderRadius: 6,
    borderLeft: '3px solid #3498db'
  }
};
