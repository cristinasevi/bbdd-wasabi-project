import { pool } from '@/app/api/lib/db';

export async function getPresupuestoMensual(idDepartamento) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        b.id_DepartamentoFK,
        SUM(b.cantidad_inicial) / 12 AS presupuesto_mensual,
        MIN(b.fecha_inicio) AS fecha_inicio,
        MAX(b.fecha_final) AS fecha_final
      FROM Bolsa b
      WHERE b.id_Bolsa IN (
        SELECT bp.id_BolsaFK
        FROM Bolsa_Presupuesto bp
      )
      AND b.id_DepartamentoFK = ?
      GROUP BY b.id_DepartamentoFK
    `,
      [idDepartamento]
    );
    return rows;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
}