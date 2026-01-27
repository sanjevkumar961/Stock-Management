import { useState, useEffect, useMemo } from 'react';
import Select from 'react-select';
import { apiGet, apiPost } from '../api/api';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../component/ToastContext';
import { DeliveryChallan } from './DeliveryChallan';


export default function TransferStock() {
    const { user } = useAuth();
    const { showToast } = useToast();

    const [materials, setMaterials] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [rows, setRows] = useState([]);
    const [fromWh, setFromWh] = useState('');
    const [toWh, setToWh] = useState('');
    const [toMs, setToMs] = useState('');
    const [preparedBy, setPreparedBy] = useState(user?.email || '');
    const [dcData, setDcData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    /* ============================
       Load masters
    ============================ */
    useEffect(() => {
        if (!user) return;
        Promise.all([
            apiGet('materials', user),
            apiGet('warehouses', user)
        ]).then(([m, w]) => {
            if (m.success) setMaterials(m.data);
            if (w.success) setWarehouses(w.data);
            setLoading(false);
        });
    }, [user]);

    const availableMaterials = fromWh
        ? materials.filter(m => m.warehouse_id === fromWh && m.current_stock > 0)
        : [];

    function getCurrentStock(materialCode) {
        const mat = materials.find(
            m => m.material_code === materialCode && m.warehouse_id === fromWh
        );
        return mat ? Number(mat.current_stock) : 0;
    }

    function getSelectableMaterials(currentRowIndex) {
        const selectedCodes = rows
            .filter((_, idx) => idx !== currentRowIndex)
            .map(r => r.material_code)
            .filter(Boolean);

        return availableMaterials.filter(
            m => !selectedCodes.includes(m.material_code)
        );
    }

    function getMaterialPrice(materialCode) {
        const mat = materials.find(
            m => m.material_code === materialCode && m.warehouse_id === fromWh
        );
        return mat ? Number(mat.price) : 0;
    }

    function addRow() {
        if (!fromWh) {
            showToast('Select From Warehouse first', 'error');
            return;
        }
        setRows(r => [...r, { material_code: '', quantity: '', remarks: '' }]);
    }

    function updateRow(i, field, val) {
        const copy = [...rows];

        if (field === 'material_code') {
            copy[i].material_code = val;
            copy[i].quantity = '';
        } else {
            copy[i][field] = val;
        }

        setRows(copy);
    }

    function removeRow(i) {
        setRows(rows.filter((_, idx) => idx !== i));
    }

    const toWarehouseOptions = useMemo(() => {
            return warehouses.filter(w => w.warehouse_id !== fromWh);
    }, [warehouses, fromWh]);

    async function submit() {
        if (submitting) return;
        setSubmitting(true);

        try {
            if (!fromWh || !toWh || fromWh === toWh) {
                throw new Error('Select valid warehouses');
            }

            if (!rows.length) {
                throw new Error('Add at least one material');
            }

            for (const r of rows) {
                const max = getCurrentStock(r.material_code);
                if (r.quantity <= 0 || r.quantity > max) {
                    throw new Error(`Invalid quantity for material ${r.material_code}`);
                }
            }

            const enrichedRows = rows.map(r => {
                const price = getMaterialPrice(r.material_code);
                const qty = Number(r.quantity) || 0;
                return {
                    ...r,
                    price,
                    amount: price * qty
                };
            });

            const res = await apiPost(
                'transfer_stock_bulk',
                {
                    from_warehouse: fromWh,
                    to_warehouse: toWh,
                    to_ms: toMs,
                    prepared_by: preparedBy,
                    items: enrichedRows
                },
                user
            );

            if (!res.success) throw new Error(res.error);

            setDcData({
                dc_no: res.result.dc_no,
                rows: enrichedRows,
                fromWh,
                toWh,
                toMs,
                preparedBy,
                date: new Date()
            });
            showToast('Transfer completed. DC ready', 'success');
        } catch (e) {
            showToast(e.message || 'Transfer failed', 'error');
        } finally {
            setRows([]);
            setFromWh('');
            setToWh('');
            setToMs('');
            setSubmitting(false);
        }
    }

    if (loading) return <div style={styles.center}>Loading…</div>;

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>🔄 Transfer Stock Between Warehouses</h2>

            {/* Header Card */}
            <div style={styles.card}>
                <div style={styles.grid2}>
                    <div>
                        <label style={styles.label}>From Warehouse</label>
                        <select value={fromWh} onChange={e => setFromWh(e.target.value)} style={styles.input}>
                            <option value="">Select warehouse</option>
                            {warehouses.map(w => (
                                <option key={w.warehouse_id} value={w.warehouse_id}>
                                    {w.warehouse_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={styles.label}>To Warehouse</label>
                        <select value={toWh} onChange={e => setToWh(e.target.value)} style={styles.input}>
                            <option value="">Select warehouse</option>
                            {toWarehouseOptions.map(w => (
                                <option key={w.warehouse_id} value={w.warehouse_id}>
                                    {w.warehouse_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={styles.label}>To M/s (Company)</label>
                        <input
                            placeholder="Optional"
                            value={toMs}
                            onChange={e => setToMs(e.target.value)}
                            style={styles.input}
                        />
                    </div>

                    <div>
                        <label style={styles.label}>Prepared by</label>
                        <input
                            placeholder="Your email"
                            value={preparedBy}
                            onChange={e => setPreparedBy(e.target.value)}
                            style={styles.input}
                        />
                    </div>
                </div>
            </div>

            {/* Materials Card */}
            <div style={styles.card}>
                <h3 style={styles.sectionTitle}>📦 Materials to Transfer</h3>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Material</th>
                            <th style={{ ...styles.th, width: 120 }}>Quantity</th>
                            <th style={styles.th}>Remarks</th>
                            <th style={{ ...styles.th, width: 50, textAlign: 'center' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, i) => (
                            <tr key={i} style={styles.tableRow}>
                                <td style={styles.td}>
                                    <Select
                                        options={getSelectableMaterials(i).map(m => ({
                                            value: m.material_code,
                                            label: `${m.material_name} (Stock: ${m.current_stock})`
                                        }))}
                                        value={r.material_code ? { value: r.material_code, label: getSelectableMaterials(i).find(m => m.material_code === r.material_code)?.material_name || '' } : null}
                                        onChange={option => updateRow(i, 'material_code', option?.value || '')}
                                        isClearable
                                        isSearchable
                                        placeholder="Select material..."
                                        styles={{
                                            control: (base) => ({
                                                ...base,
                                                borderRadius: 4,
                                                border: '1px solid #d0d7e0',
                                                minHeight: 36
                                            })
                                        }}
                                    />
                                </td>

                                <td style={styles.td}>
                                    <input
                                        type="number"
                                        min="1"
                                        max={getCurrentStock(r.material_code)}
                                        value={r.quantity}
                                        onChange={e => updateRow(i, 'quantity', e.target.value)}
                                        style={styles.input}
                                    />
                                </td>

                                <td style={styles.td}>
                                    <input
                                        placeholder="Optional notes"
                                        value={r.remarks}
                                        onChange={e => updateRow(i, 'remarks', e.target.value)}
                                        style={styles.input}
                                    />
                                </td>

                                <td style={{ ...styles.td, textAlign: 'center' }}>
                                    <button
                                        style={styles.deleteBtn}
                                        onClick={() => removeRow(i)}
                                        title="Remove row"
                                    >
                                        ✕
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <button style={styles.addBtn} onClick={addRow}>
                    ➕ Add Material
                </button>
            </div>

            {/* Actions */}
            <div style={styles.actionBar}>
                <button
                    style={styles.submitBtn}
                    onClick={submit}
                    disabled={submitting}
                >
                    {submitting ? '⏳ Processing…' : '✓ Submit & Generate DC'}
                </button>
            </div>
            {dcData && <DeliveryChallan data={dcData} />}
        </div>
    );
}

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
    card: {
        padding: 24,
        border: '1px solid #e0e0e0',
        borderRadius: 12,
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        marginBottom: 24
    },
    grid2: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 16
    },
    label: {
        display: 'block',
        fontWeight: 600,
        color: '#2c3e50',
        marginBottom: 8,
        fontSize: 14
    },
    input: {
        width: '100%',
        padding: '10px 12px',
        border: '1px solid #d0d7e0',
        borderRadius: 6,
        fontSize: 14,
        fontFamily: 'inherit',
        background: '#fff',
        color: '#2c3e50',
        boxSizing: 'border-box'
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 700,
        color: '#1a1a1a',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 8
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        marginBottom: 16
    },
    th: {
        padding: '12px 16px',
        textAlign: 'left',
        fontWeight: 600,
        color: '#2c3e50',
        fontSize: 13,
        background: '#f5f7fa',
        border: 'none',
        borderBottom: '2px solid #e0e6ed'
    },
    tableRow: {
        borderBottom: '1px solid #e8ecf1'
    },
    td: {
        padding: '14px 16px',
        color: '#34495e',
        fontSize: 14
    },
    addBtn: {
        padding: '10px 16px',
        fontWeight: 600,
        borderRadius: 6,
        border: '2px dashed #3498db',
        background: '#f0f8ff',
        color: '#3498db',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
    },
    deleteBtn: {
        padding: '6px 10px',
        fontWeight: 600,
        borderRadius: 4,
        border: 'none',
        background: '#ffebee',
        color: '#c62828',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
    },
    actionBar: {
        marginTop: 24,
        display: 'flex',
        gap: 12
    },
    submitBtn: {
        flex: 1,
        padding: '12px 20px',
        background: '#27ae60',
        color: '#fff',
        border: 'none',
        borderRadius: 6,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        fontSize: 15
    }
};