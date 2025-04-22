import { pool } from '@/app/api/lib/db';

export async function getDepartamentos() {
  try {
    const [rows] = await pool.query('SELECT * FROM Departamento');
    return rows;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
}

export async function getOrdenes() {
  try {
    const [rows] = await pool.query('SELECT * FROM Orden');
    return rows;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
}