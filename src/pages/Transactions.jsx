import { useEffect, useState, useMemo } from 'react';
import { apiGet } from '../api/api';
import { useAuth } from '../auth/AuthContext';

export default function Transactions() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    apiGet('transactions', user).then(res => {
      if (res.success) setRows(res.data);
    });
    apiGet('materials', user).then(res => {
      if (res.success) {
        const uniqueMaterialsMap = new Map(); res.data.forEach(m => {
          if (!uniqueMaterialsMap.has(m.material_code)) { uniqueMaterialsMap.set(m.material_code, m); }
        });
        setMaterials(Array.from(uniqueMaterialsMap.values()));
      }
    });
  }, [user]);

  const rowsWithMaterialName = useMemo(() => {
  if (!rows.length || !materials.length) return [];

  return rows.map(r => ({
    ...r,
    material_name:
      materials.find(m => m.material_code === r.material_code)
        ?.material_name || ''
  }));
}, [rows, materials]);


  return (
    <table>
      <thead>
        <tr>
          <th>Txn ID</th>
          <th>Material</th>
          <th>Qty</th>
          <th>Type</th>
          <th>From Warehouse</th>
          <th>To Warehouse</th>
          <th>User</th>
          <th>DateTime</th>
          <th>Remarks</th>
        </tr>
      </thead>
      <tbody>
        {rowsWithMaterialName.map(t => (
          <tr key={t.txn_id}>
            <td>{t.txn_id}</td>
            <td>{t.material_name}</td>
            <td>{t.quantity}</td>
            <td>{t.type}</td>
            <td>{t.from_warehouse}</td>
            <td>{t.to_warehouse}</td>
            <td>{t.user_email}</td>
            <td>{t.date_time}</td>
            <td>{t.remarks}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}