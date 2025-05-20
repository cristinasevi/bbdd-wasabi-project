export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const departamentoId = searchParams.get('departamentoId');
    
    if (!departamentoId) {
      return NextResponse.json(
        { error: 'ID de departamento no proporcionado' },
        { status: 400 }
      );
    }
    
    // Consultar años que ya tienen bolsas de presupuesto o inversión
    const [yearsRows] = await pool.query(`
      SELECT DISTINCT YEAR(b.fecha_inicio) AS year
      FROM Bolsa b
      WHERE b.id_DepartamentoFK = ?
      ORDER BY year
    `, [departamentoId]);
    
    // Extraer los años en un array
    const years = yearsRows.map(row => row.year);
    
    // Obtener los totales de presupuesto por año para este departamento
    const [presupuestosPorAño] = await pool.query(`
      SELECT 
        YEAR(b.fecha_inicio) AS year,
        SUM(CASE WHEN bp.id_BolsaFK IS NOT NULL THEN b.cantidad_inicial ELSE 0 END) AS total_presupuesto,
        SUM(CASE WHEN bi.id_BolsaFK IS NOT NULL THEN b.cantidad_inicial ELSE 0 END) AS total_inversion
      FROM Bolsa b
      LEFT JOIN Bolsa_Presupuesto bp ON b.id_Bolsa = bp.id_BolsaFK
      LEFT JOIN Bolsa_Inversion bi ON b.id_Bolsa = bi.id_BolsaFK
      WHERE b.id_DepartamentoFK = ?
      GROUP BY YEAR(b.fecha_inicio)
      ORDER BY year
    `, [departamentoId]);
    
    return NextResponse.json({ 
      years,
      presupuestosPorAño
    });
  } catch (error) {
    console.error('Error obteniendo información de bolsas existentes:', error);
    return NextResponse.json(
      { error: 'Error obteniendo información de bolsas existentes' },
      { status: 500 }
    );
  }
}