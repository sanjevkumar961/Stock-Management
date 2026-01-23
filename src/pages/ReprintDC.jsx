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

    if (loading) return <div style={{ textAlign: 'center', padding: 32 }}>Loading…</div>;

    return (
        <div className="page">
            <h2>Reprint Delivery Challan</h2>
            <input
                placeholder="Enter DC No"
                value={dcNo}
                onChange={e => setDcNo(e.target.value)}
            />
            <button onClick={fetchDC} disabled={!dcNo || loading}>
                Fetch DC
            </button>
            {dcData && (
                <>
                    <DeliveryChallan data={dcData} />
                    <div className="action-bar no-print">
                        {/* <button onClick={() => window.print()}>Print</button> */}
                        {!dcData.verifiedAt && (
                            <button onClick={verifyDC} className="btn-outline">
                                Verify DC
                            </button>
                        )}
                        {dcData.verifiedAt && (
                            <span>Verified at: {new Date(dcData.verifiedAt).toLocaleString()}</span>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
