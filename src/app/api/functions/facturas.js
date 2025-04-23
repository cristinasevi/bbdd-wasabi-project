import { pool } from '@/app/api/lib/db';

export async function getFacturas() {
  try {
    const [rows] = await pool.query(`
      SELECT 
        f.idFactura,
        f.Num_factura,
        f.Fecha_emision,
        f.Ruta_pdf,
        o.Num_orden,
        p.Nombre AS Proveedor,
        d.Nombre AS Departamento,
        e.Tipo AS Estado
      FROM Factura f
      JOIN Orden o ON f.idOrdenFK = o.idOrden
      JOIN Proveedor p ON o.id_ProveedorFK = p.idProveedor
      JOIN Departamento d ON o.id_DepartamentoFK = d.id_Departamento
      JOIN Estado e ON f.idEstadoFK = e.idEstado
    `);
    return rows;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
}
