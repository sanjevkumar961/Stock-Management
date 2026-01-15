import { useEffect, useState, useMemo } from 'react';
import { apiGet } from '../api/api';
import { useAuth } from '../auth/AuthContext';

export default function Transactions() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ===============================
     Data Load
  ================================ */
  useEffect(() => {
    let mounted = true;

    Promise.all([
      apiGet('transactions', user),
      apiGet('materials', user)
    ]).then(([txRes, matRes]) => {
      if (!mounted) return;

      if (txRes.success) setRows(txRes.data);

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
  }, [user]);

  /* ===============================
     Derived Data
  ================================ */
  const rowsWithMaterialName = useMemo(() => {
    if (!rows.length || !materials.length) return [];
    return rows.map(r => ({
      ...r,
      material_name:
        materials.find(m => m.material_code === r.material_code)
          ?.material_name || r.material_code
    }));
  }, [rows, materials]);

  if (loading) {
    return <div style={styles.center}>Loading transactions…</div>;
  }

  if (!rowsWithMaterialName.length) {
    return <div style={styles.center}>No transactions found</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Transactions</h2>

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
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {rowsWithMaterialName.map(t => (
              <tr key={t.txn_id}>
                <td>{t.txn_id}</td>
                <td>{t.material_name}</td>
                <td>{t.quantity}</td>
                <td>{formatType(t.type)}</td>
                <td>{t.from_warehouse || '-'}</td>
                <td>{t.to_warehouse || '-'}</td>
                <td>{t.user_email}</td>
                <td>{formatDate(t.date_time)}</td>
                <td>{t.remarks || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="mobile-only" style={styles.cards}>
        {rowsWithMaterialName.map(t => (
          <div key={t.txn_id} style={styles.card}>
            <div style={styles.cardHeader}>
              <strong>{t.material_name}</strong>
              <span style={styles.qty}>{t.quantity}</span>
            </div>

            <div style={styles.row}>Type: {formatType(t.type)}</div>
            <div style={styles.row}>From: {t.from_warehouse || '-'}</div>
            <div style={styles.row}>To: {t.to_warehouse || '-'}</div>
            <div style={styles.row}>User: {t.user_email}</div>
            <div style={styles.row}>
              Date: {formatDate(t.date_time)}
            </div>

            {t.remarks && (
              <div style={styles.remarks}>{t.remarks}</div>
            )}
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
  container: { padding: 16 },
  title: { marginBottom: 12 },
  center: { padding: 24, textAlign: 'center' },

  tableWrapper: { overflowX: 'auto' },
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
    borderRadius: 8,
    padding: 12,
    background: '#fff'
  },

  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 6
  },

  qty: {
    fontWeight: 700
  },

  row: {
    fontSize: 14,
    marginBottom: 4
  },

  remarks: {
    marginTop: 6,
    fontSize: 13,
    fontStyle: 'italic',
    color: '#555'
  }
};
