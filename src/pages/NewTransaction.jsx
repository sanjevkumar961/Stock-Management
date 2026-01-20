import { useState, useEffect, useMemo } from 'react';
import { apiPost, apiGet } from '../api/api';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../component/ToastContext';
import { enqueueTransaction } from '../component/offlineQueue';

export default function NewTransaction() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    material_code: '',
    quantity: '',
    action: 'stock_in',
    from_warehouse: '',
    to_warehouse: '',
    remarks: ''
  });

  const [materials, setMaterials] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true); // start with loading

  /* ===============================
     Data Load (wait for both APIs)
  ================================ */
  useEffect(() => {
    if (!user) return;

    setLoading(true);

    Promise.all([
      apiGet('materials', user, logout).then(res => {
        if (res.success) setMaterials(res.data);
      }),
      apiGet('warehouses', user, logout).then(res => {
        if (res.success) setWarehouses(res.data);
      })
    ]).finally(() => setLoading(false));
  }, [user, logout]);

  /* Reset warehouses when material/action changes */
  useEffect(() => {
    setForm(f => ({
      ...f,
      from_warehouse: '',
      to_warehouse: ''
    }));
  }, [form.material_code, form.action]);

  /* Role safety */
  useEffect(() => {
    if (form.action === 'adjust_stock' && user?.role !== 'manager') {
      setForm(f => ({ ...f, action: 'stock_in' }));
    }
  }, [form.action, user?.role]);

  /* ===============================
     Derived Data
  ================================ */
  const selectedMaterial = useMemo(
    () => materials.find(m => m.material_code === form.material_code),
    [materials, form.material_code]
  );

  const stockByWarehouse = useMemo(() => {
    if (!selectedMaterial) return {};
    return materials
      .filter(m => m.material_code === selectedMaterial.material_code)
      .reduce((acc, m) => {
        acc[m.warehouse_id] = Number(m.current_stock) || 0;
        return acc;
      }, {});
  }, [materials, selectedMaterial]);

  const fromWarehouseOptions = useMemo(() => {
    if (!form.material_code) return [];
    if (form.action === 'stock_in') return warehouses;

    return warehouses.filter(
      w => (stockByWarehouse[w.warehouse_id] || 0) > 0
    );
  }, [warehouses, stockByWarehouse, form.material_code, form.action]);

  /* ===============================
     Validation
  ================================ */
  function isFormValid() {
    const qty = Number(form.quantity);
    if (!form.material_code || !qty || qty <= 0) return false;

    if (form.action === 'stock_in') return !!form.to_warehouse;
    if (form.action === 'stock_out') return !!form.from_warehouse;

    if (form.action === 'adjust_stock') {
      return !!form.from_warehouse && form.remarks.trim().length > 0;
    }

    return false;
  }

  /* ===============================
     Submit
  ================================ */
  async function submit() {
    if (loading) return;
    setLoading(true);

    let payload = null;

    try {
      const qty = Number(form.quantity);

      payload = {
        material_code: form.material_code.trim(),
        quantity: qty,
        remarks: form.remarks?.trim() || ''
      };

      if (form.action === 'stock_out' && form.from_warehouse) {
        const available = stockByWarehouse[form.from_warehouse] || 0;
        if (qty > available) {
          showToast(`Insufficient stock. Available: ${available}`, 'error');
          return;
        }
      }

      if (form.action === 'stock_in') {
        payload.to_warehouse = form.to_warehouse;
      }

      if (form.action === 'stock_out' || form.action === 'adjust_stock') {
        payload.from_warehouse = form.from_warehouse;
      }

      const res = await apiPost(form.action, payload, user);

      if (res.success) {
        showToast('Transaction saved', 'success');
      } else {
        throw new Error(res.error);
      }
    } catch (err) {
      if (!payload) {
        showToast('Failed to prepare transaction', 'error');
        return;
      }
      enqueueTransaction({ action: form.action, payload, user });
      showToast('Offline: Transaction queued', 'info');
    } finally {
      setLoading(false);
    }
  }

  /* ===============================
     UI
  ================================ */
  if (loading) {
    return <div style={{ textAlign: 'center', padding: 32 }}>Loading…</div>;
  }

  return (
    <div style={styles.container}>
      <h2>New Transaction</h2>

      <div style={styles.card}>
        <label>Material</label>
        <select
          value={form.material_code}
          onChange={e => setForm({ ...form, material_code: e.target.value })}
        >
          <option value="">Select material</option>
          {Array.from(
            new Map(materials.map(m => [m.material_code, m])).values()
          ).map(m => (
            <option key={m.material_code} value={m.material_code}>
              {m.material_name}
            </option>
          ))}
        </select>

        <label>Action</label>
        <select
          value={form.action}
          onChange={e => setForm({ ...form, action: e.target.value })}
        >
          <option value="stock_in">Stock In</option>
          <option value="stock_out">Stock Out</option>
          {user?.role === 'manager' && (
            <option value="adjust_stock">Adjust Stock</option>
          )}
        </select>

        {form.action !== 'stock_in' && (
          <>
            <label>From Warehouse</label>
            <select
              value={form.from_warehouse}
              onChange={e =>
                setForm({ ...form, from_warehouse: e.target.value })
              }
              disabled={!form.material_code}
            >
              <option value="">Select warehouse</option>
              {fromWarehouseOptions.map(w => (
                <option key={w.warehouse_id} value={w.warehouse_id}>
                  {w.warehouse_name}
                </option>
              ))}
            </select>
          </>
        )}

        {form.action === 'stock_in' && (
          <>
            <label>To Warehouse</label>
            <select
              value={form.to_warehouse}
              onChange={e =>
                setForm({ ...form, to_warehouse: e.target.value })
              }
            >
              <option value="">Select warehouse</option>
              {warehouses.map(w => (
                <option key={w.warehouse_id} value={w.warehouse_id}>
                  {w.warehouse_name}
                </option>
              ))}
            </select>
          </>
        )}

        <label>Quantity</label>
        <input
          type="number"
          value={form.quantity}
          onChange={e => setForm({ ...form, quantity: e.target.value })}
        />

        <label>
          Remarks {form.action === 'adjust_stock' && '(required)'}
        </label>
        <textarea
          value={form.remarks}
          onChange={e => setForm({ ...form, remarks: e.target.value })}
        />

        <button
          onClick={submit}
          disabled={!isFormValid() || loading}
          style={styles.button}
        >
          {loading ? 'Saving…' : 'Submit'}
        </button>
      </div>
    </div>
  );
}

/* ===============================
   Styles
================================ */
const styles = {
  container: {
    padding: 16,
    maxWidth: 520,
    margin: '0 auto'
  },
  card: {
    display: 'grid',
    gap: 12,
    padding: 16,
    borderRadius: 10,
    border: '1px solid #ddd',
    background: '#fff'
  },
  button: {
    marginTop: 12,
    padding: '12px 16px',
    fontSize: 16,
    fontWeight: 600
  }
};
