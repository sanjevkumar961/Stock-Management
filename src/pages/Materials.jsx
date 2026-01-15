import { useEffect, useState } from 'react';
import { apiGet } from '../api/api';
import { useAuth } from '../auth/AuthContext';

export default function Materials() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    apiGet('materials', user).then(res => {
      if (res.success) setMaterials(res.data);
    });
  }, []);

  return (
    <table>
      <thead>
        <tr>
          <th>Material</th>
          <th>Warehouse</th>
          <th>Stock</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {materials.map(m => (
          <tr key={m.material_code + m.warehouse_id}>
            <td>{m.material_name}</td>
            <td>{m.warehouse_id}</td>
            <td>{m.current_stock}</td>
            <td>{m.stock_ok ? 'OK' : 'LOW'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
