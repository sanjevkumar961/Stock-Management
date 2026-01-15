import { useState, useEffect, useMemo } from 'react';
import { apiPost, apiGet } from '../api/api';
import { useAuth } from '../auth/AuthContext';

export default function NewTransaction() {
  const { user } = useAuth();
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    apiGet('materials', user).then(res => { if (res.success) setMaterials(res.data); });

    apiGet('warehouses', user).then(res => {
      if (res.success) setWarehouses(res.data);
    });
  }, [user]);

  useEffect(() => {
    setForm(f => ({
      ...f,
      from_warehouse: '',
      to_warehouse: ''
    }));
  }, [form.material_code, form.action]);

  useEffect(() => {
    if (form.action === 'adjust_stock' && user?.role !== 'manager') {
      setForm(f => ({
        ...f,
        action: 'stock_in'
      }));
    }
  }, [user?.role, form.action]);



  // 1️⃣ Find selected material
  const selectedMaterial = useMemo(() => {
    return materials.find(m => m.material_code === form.material_code);
  }, [materials, form.material_code]);

  // 2️⃣ Aggregate stock by warehouse for the selected material
  const stockByWarehouse = useMemo(() => {
    if (!selectedMaterial) return {};
    return materials
      .filter(m => m.material_code === selectedMaterial.material_code)
      .reduce((acc, m) => {
        acc[m.warehouse_id] = Number(m.current_stock) || 0;
        return acc;
      }, {});
  }, [materials, selectedMaterial]);

  // 3️⃣ Warehouses that have stock (for stock_out)
  const fromWarehouseOptions = useMemo(() => {
    if (!form.material_code) return [];

    if (form.action === 'stock_in') return warehouses; // all warehouses for stock_in

    // stock_out or stock_used
    return warehouses.filter(
      w => (stockByWarehouse[w.warehouse_id] || 0) > 0
    );
  }, [warehouses, stockByWarehouse, form.material_code, form.action]);

  // 4️⃣ To warehouse options
  const toWarehouseOptions = useMemo(() => {
    if (!form.material_code) return [];

    if (form.action === 'stock_out') return []; // no to warehouse

    if (form.action === 'transfer_stock') {
      // exclude the from warehouse
      return warehouses.filter(w => w.warehouse_id !== form.from_warehouse);
    }

    return warehouses; // for stock_in, show all
  }, [warehouses, form.action, form.from_warehouse, form.material_code]);


  function isFormValid() {
    if (!form.material_code) return false;

    const qty = Number(form.quantity);
    if (!qty || qty <= 0) return false;

    if (form.action === 'stock_in') {
      return !!form.to_warehouse;
    }

    if (form.action === 'stock_out') {
      return !!form.from_warehouse;
    }

    if (form.action === 'transfer_stock') {
      return !!form.from_warehouse && !!form.to_warehouse;
    }

    if (form.action === 'adjust_stock') {
      return !!form.from_warehouse && form.remarks.trim().length > 0;
    }

    return false;
  }

  async function submit() {
    if (loading) return;
    setLoading(true);

    try {
      const qty = Number(form.quantity);

      const payload = {
        material_code: form.material_code.trim(),
        quantity: qty,
        remarks: form.remarks?.trim() || ''
      };

      // Stock availability check
      if (
        (form.action === 'stock_out' || form.action === 'transfer_stock') &&
        form.from_warehouse
      ) {
        const available = stockByWarehouse[form.from_warehouse] || 0;
        if (qty > available) {
          alert(`Insufficient stock. Available: ${available}`);
          return;
        }
      }

      if (form.action === 'stock_in') {
        payload.to_warehouse = form.to_warehouse;
      }

      if (
        form.action === 'stock_out' ||
        form.action === 'stock_used' ||
        form.action === 'adjust_stock'
      ) {
        payload.from_warehouse = form.from_warehouse;
      }

      if (form.action === 'transfer_stock') {
        payload.from_warehouse = form.from_warehouse;
        payload.to_warehouse = form.to_warehouse;
      }

      const res = await apiPost(form.action, payload, user);
      alert(res.success ? 'Saved' : res.error);

      // Optional reset
      if (res.success) {
        setForm(f => ({
          ...f,
          quantity: '',
          remarks: ''
        }));
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting transaction');
    } finally {
      setLoading(false);
    }
  }


  return (
    <>
      <select
        value={form.material_code}
        onChange={e => setForm({ ...form, material_code: e.target.value })}
      >
        <option value="">Select material</option>
        {/* Show only unique materials in the dropdown */}
        {Array.from(
          new Map(materials.map(m => [m.material_code, m])).values()
        ).map(m => (
          <option key={m.material_code} value={m.material_code}>
            {m.material_name}
          </option>
        ))}
      </select>

      <input
        type="number"
        placeholder="Quantity"
        value={form.quantity}
        onChange={e => setForm({ ...form, quantity: e.target.value })}
      />

      <select
        value={form.action}
        onChange={e => setForm({ ...form, action: e.target.value })}
      >
        <option value="stock_in">Stock In</option>
        <option value="stock_out">Stock Out</option>
        <option value="transfer_stock">Transfer</option>

        {/* 🔐 Managers only */}
        {user?.role === 'manager' && (
          <option value="adjust_stock">Adjust Stock</option>
        )}
      </select>

      {form.action !== 'stock_in' && (
        <select
          value={form.from_warehouse}
          onChange={e =>
            setForm({ ...form, from_warehouse: e.target.value })
          }
          disabled={!form.material_code}
        >
          <option value="">From Warehouse</option>
          {fromWarehouseOptions.map(w => (
            <option key={w.warehouse_id} value={w.warehouse_id}>
              {w.warehouse_name}
            </option>
          ))}
        </select>
      )}

      {form.action !== 'stock_out' && form.action !== 'adjust_stock' && (
        <select
          value={form.to_warehouse}
          onChange={e =>
            setForm({ ...form, to_warehouse: e.target.value })
          }
          disabled={
            !form.material_code ||
            (form.action === 'transfer_stock' && !form.from_warehouse)
          }
        >
          <option value="">To Warehouse</option>
          {toWarehouseOptions.map(w => (
            <option key={w.warehouse_id} value={w.warehouse_id}>
              {w.warehouse_name}
            </option>
          ))}
        </select>
      )}
      <textarea
        placeholder={
          form.action === 'adjust_stock'
            ? 'Remarks (required for adjustment)'
            : 'Remarks (optional)'
        }
        value={form.remarks}
        onChange={e => setForm({ ...form, remarks: e.target.value })}
      />

      <button disabled={!isFormValid()} onClick={submit}>
        Submit
      </button>

    </>
  );
}
