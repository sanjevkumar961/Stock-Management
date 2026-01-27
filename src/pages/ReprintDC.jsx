import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../api/api';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../component/ToastContext';
import { DeliveryChallan } from './DeliveryChallan';


export default function ReprintDC() {
    const [dcNo, setDcNo] = useState("");
    const [dcData, setDcData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user, logout } = useAuth();
    const { showToast } = useToast();
    const [materials, setMaterials] = useState([]);

    /* ============================
       Load masters
    ============================ */
    useEffect(() => {
        if (!user) return;
        apiGet('materials', user, logout)
            .then((m) => {
                if (m.success) {
                    setMaterials(m.data);
                }
            })
            .catch((err) => {
                console.error('Failed to fetch materials', err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [user, logout]);

    function getMaterialPrice(materialCode, fromWh) {
        const mat = materials.find(
            m => m.material_code === materialCode && m.warehouse_id === fromWh
        );
        return mat ? Number(mat.price) : 0;
    }

    const fetchDC = async () => {
        if (!user) return;
        setLoading(true);
        const res = await apiGet('get_dc_by_no', user, logout, { val: dcNo });

        if (res?.success) {
            const enrichedRows = res.data.rows.map(r => {
                const price = getMaterialPrice(r.material_code, res.data.fromWh);
                const qty = Number(r.quantity) || 0;

                return {
                    ...r,
                    price,
                    amount: price * qty
                };
            });
            setDcData({
                dc_no: res.data.dc_no,
                rows: enrichedRows,
                fromWh: res.data.fromWh,
                toWh: res.data.toWh,
                toMs: res.data.toMs,
                preparedBy: res.data.preparedBy,
                date: res.data.date,
                verifiedAt: res.data.verifiedAt
            });
        } else {
            setDcData(null);
            showToast("DC not found", 'error');
        }

        setLoading(false);
    };

    const verifyDC = async () => {
        if (!user) return;
        if (!window.confirm("Verify this DC?")) return;

        let payload = { val: dcNo };

        const res = await apiPost('verify_dc', payload, user, logout);
        if (res?.success) {
            showToast("DC verified successfully", 'success');
            fetchDC(); // refresh verifiedAt
        } else {
            showToast("Failed to verify DC", 'error');
        }
    };

    if (loading) return <div style={styles.center}>Loading…</div>;

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>📄 Reprint Delivery Challan</h2>
            
            <div style={styles.searchCard}>
                <label style={styles.label}>DC Number</label>
                <div style={styles.searchRow}>
                    <input
                        placeholder="Enter DC No"
                        value={dcNo}
                        onChange={e => setDcNo(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && fetchDC()}
                        style={styles.input}
                    />
                    <button onClick={fetchDC} disabled={!dcNo || loading} style={styles.searchButton}>
                        {loading ? '⏳ Searching…' : '🔍 Fetch'}
                    </button>
                </div>
            </div>
            
            {dcData && (
                <>
                    <DeliveryChallan data={dcData} />
                    <div className="action-bar no-print" style={styles.actionBar}>
                        {!dcData.verifiedAt && (
                            <button onClick={verifyDC} style={styles.verifyButton}>
                                ✓ Verify DC
                            </button>
                        )}
                        {dcData.verifiedAt && (
                            <div style={styles.verifiedBadge}>
                                ✓ Verified at: {new Date(dcData.verifiedAt).toLocaleString()}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
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
    fontSize: 28,
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
  searchCard: {
    padding: 20,
    border: '1px solid #e0e0e0',
    borderRadius: 12,
    background: '#fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    marginBottom: 24
  },
  label: {
    display: 'block',
    fontWeight: 600,
    color: '#2c3e50',
    marginBottom: 10,
    fontSize: 14
  },
  searchRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'stretch'
  },
  input: {
    flex: 1,
    padding: '10px 12px',
    border: '1px solid #d0d7e0',
    borderRadius: 6,
    fontSize: 14,
    fontFamily: 'inherit'
  },
  searchButton: {
    padding: '10px 20px',
    background: '#3498db',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    whiteSpace: 'nowrap'
  },
  actionBar: {
    marginTop: 24,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    background: '#f8f9fa',
    borderRadius: 8,
    border: '1px solid #e0e0e0'
  },
  verifyButton: {
    padding: '10px 20px',
    background: '#27ae60',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  verifiedBadge: {
    padding: '10px 16px',
    background: '#d4edda',
    color: '#155724',
    borderRadius: 6,
    fontWeight: 500,
    border: '1px solid #c3e6cb'
  }
};
