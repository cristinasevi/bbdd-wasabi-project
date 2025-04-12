import { pool } from '@/app/api/lib/db';

export async function getData() {
  try {
    const [rows] = await pool.query('SELECT * FROM Departamento');
    return rows;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
}