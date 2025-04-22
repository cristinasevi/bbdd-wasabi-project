import { pool } from '@/app/api/lib/db';

export async function getOrden() {
  try {
    const [rows] = await pool.query(`
      SELECT o.*, d.Nombre AS Departamento, p.Nombre AS Proveedor
      FROM Orden o
      JOIN Departamento d ON o.id_DepartamentoFK = d.id_Departamento
      JOIN Proveedor p ON p.idProveedor = o.id_ProveedorFK
    `);
    return rows;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
}
