import { pool } from '@/app/api/lib/db';

export async function getResumenDepPrep(idDepartamento) { // Agregamos idDepartamento como parámetro
  try {
    const [rows] = await pool.query(`
      SELECT 
        b.id_DepartamentoFK,
        SUM(b.cantidad_inicial) AS total_presupuesto,
        MIN(b.fecha_inicio) AS fecha_inicio,
        MAX(b.fecha_final) AS fecha_final
      FROM Bolsa b
      WHERE b.id_Bolsa IN (
        SELECT bp.id_BolsaFK
        FROM Bolsa_Presupuesto bp
      )
      AND b.id_DepartamentoFK = ?
      GROUP BY b.id_DepartamentoFK
    `, [idDepartamento]); // Usamos el parámetro idDepartamento
    return rows;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
}
export async function getResumenDepInv(idDepartamento) { // Agregamos idDepartamento como parámetro
    try {
      const [rows] = await pool.query(`
        SELECT 
          b.id_DepartamentoFK,
          SUM(b.cantidad_inicial) AS total_inversion,
          MIN(b.fecha_inicio) AS fecha_inicio,
          MAX(b.fecha_final) AS fecha_final
        FROM Bolsa b
        WHERE b.id_Bolsa IN (
          SELECT bp.id_BolsaFK
          FROM Bolsa_Inversion bp
        )
        AND b.id_DepartamentoFK = ?
        GROUP BY b.id_DepartamentoFK
      `, [idDepartamento]); // Usamos el parámetro idDepartamento
      return rows;
    } catch (error) {
      console.error('Error executing query:', error);
      throw error;
    }
  }
  export async function getOrden(idDepartamento) {
    try {
      const [rows] = await pool.query(`
        SELECT o.*, d.Nombre AS Departamento, p.Nombre AS Proveedor
        FROM Orden o
        JOIN Departamento d ON o.id_DepartamentoFK = d.id_Departamento
        JOIN Proveedor p ON p.idProveedor = o.id_ProveedorFK
        WHERE o.id_DepartamentoFK = ?
      `, [idDepartamento]);
  
      return rows;
    } catch (error) {
      console.error('Error executing query:', error);
      throw error;
    }
}