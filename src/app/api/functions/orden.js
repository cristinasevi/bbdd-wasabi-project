import { pool } from '@/app/api/lib/db';

export async function getOrden() {
  try {
    const [rows] = await pool.query(`
      SELECT 
        MAX(o.idOrden) AS idOrden,
        MAX(o.Num_orden) AS Num_orden,
        MAX(o.Fecha) AS Fecha,
        MAX(o.Descripcion) AS Descripcion,
        MAX(o.Inventariable) AS Inventariable,
        MAX(o.Cantidad) AS Cantidad,
        MAX(o.Importe) AS Importe,
        MAX(d.Nombre) AS Departamento,
        MAX(p.Nombre) AS Proveedor,
        GROUP_CONCAT(oi.Num_inversion SEPARATOR ', ') AS Num_inversion
      FROM Orden o
      JOIN Departamento d ON o.id_DepartamentoFK = d.id_Departamento
      JOIN Proveedor p ON p.idProveedor = o.id_ProveedorFK
      LEFT JOIN Orden_Inversion oi ON o.idOrden = oi.id_InversionFK
      GROUP BY o.idOrden
    `);
    return rows;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
}
