import { useState, useEffect, useMemo } from 'react';
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

    if (loading) return <div style={{ textAlign: 'center', padding: 32 }}>Loading…</div>;

    return (
        <div className='page'>
            <h2 className='page-title'>Transfer Stock</h2>

            {/* Header Card */}
            <div className='card'>
                <div className='grid-2'>
                    <select value={fromWh} onChange={e => setFromWh(e.target.value)}>
                        <option value="">From Warehouse</option>
                        {warehouses.map(w => (
                            <option key={w.warehouse_id} value={w.warehouse_id}>
                                {w.warehouse_name}
                            </option>
                        ))}
                    </select>

                    <select value={toWh} onChange={e => setToWh(e.target.value)}>
                        <option value="">To Warehouse</option>
                        {toWarehouseOptions.map(w => (
                            <option key={w.warehouse_id} value={w.warehouse_id}>
                                {w.warehouse_name}
                            </option>
                        ))}
                    </select>

                    <input
                        placeholder="To M/s"
                        value={toMs}
                        onChange={e => setToMs(e.target.value)}
                    />

                    <input
                        placeholder="Prepared by"
                        value={preparedBy}
                        onChange={e => setPreparedBy(e.target.value)}
                    />
                </div>
            </div>

            {/* Materials Card */}
            <div className='card'>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th>Material</th>
                            <th style={{ width: 100 }}>Qty</th>
                            <th>Remarks</th>
                            <th style={{ width: 40 }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, i) => (
                            <tr key={i}>
                                <td>
                                    <select
                                        value={r.material_code}
                                        onChange={e => updateRow(i, 'material_code', e.target.value)}
                                    >
                                        <option value="">Select material</option>
                                        {getSelectableMaterials(i).map(m => (
                                            <option key={m.material_code} value={m.material_code}>
                                                {m.material_name} (Stock: {m.current_stock})
                                            </option>
                                        ))}
                                    </select>
                                </td>

                                <td>
                                    <input
                                        type="number"
                                        min="1"
                                        max={getCurrentStock(r.material_code)}
                                        value={r.quantity}
                                        onChange={e => updateRow(i, 'quantity', e.target.value)}
                                    />
                                </td>

                                <td>
                                    <input
                                        placeholder="Optional"
                                        value={r.remarks}
                                        onChange={e => updateRow(i, 'remarks', e.target.value)}
                                    />
                                </td>

                                <td>
                                    <button
                                        className="icon-btn"
                                        onClick={() => removeRow(i)}
                                    >
                                        ×
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <button style={styles.addBtn} onClick={addRow}>
                    + Add Material
                </button>
            </div>

            {/* Actions */}
            <div className="action-bar">
                <button
                    className="btn-primary"
                    onClick={submit}
                    disabled={submitting}
                >
                    {submitting ? 'Processing…' : 'Submit & Generate DC'}
                </button>
            </div>
            {dcData && <DeliveryChallan data={dcData} />}
        </div>
    );
}

const styles = {
    table: {
        width: '100%',
        borderCollapse: 'collapse'
    },
    addBtn: {
        marginTop: 12,
        padding: '10px 14px',
        fontWeight: 600,
        borderRadius: 8,
        border: '1px dashed #555',
        background: '#f9f9f9'
    }
};