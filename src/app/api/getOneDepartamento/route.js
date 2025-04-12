import { pool } from '@/app/api/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const codigoDepartamento = searchParams.get('id_Departamento');

    if (!codigoDepartamento) {
      return NextResponse.json(
        { error: 'El código del departamento es requerido' },
        { status: 400 }
      );
    }

    const [rows] = await pool.query('SELECT * FROM Departamento WHERE id_Departamento = ?', [codigoDepartamento]);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Departamento no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]); // Solo un departamento
  } catch (error) {
    console.error('Error al obtener el departamento:', error);
    return NextResponse.json(
      { error: 'Error al obtener el departamento' },
      { status: 500 }
    );
  }
}
