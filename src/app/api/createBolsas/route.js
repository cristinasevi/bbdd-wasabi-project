import { pool } from '@/app/api/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();
    const { departamentoId, año, cantidadPresupuesto, cantidadInversion } = data;
    
    // Validar datos requeridos
    if (!departamentoId) {
      return NextResponse.json(
        { error: 'ID de departamento no proporcionado' },
        { status: 400 }
      );
    }
    
    if (!año) {
      return NextResponse.json(
        { error: 'Año no proporcionado' },
        { status: 400 }
      );
    }
    
    if (cantidadPresupuesto === 0 && cantidadInversion === 0) {
      return NextResponse.json(
        { error: 'Debe proporcionar al menos una cantidad para presupuesto o inversión' },
        { status: 400 }
      );
    }
    
    // Iniciar transacción
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      const fechaInicio = `${año}-01-01`;
      const fechaFinal = `${año}-12-31`;
      const resultados = [];
      
      // Crear bolsa de presupuesto si se proporcionó una cantidad
      if (cantidadPresupuesto > 0) {
        // 1. Insertar en la tabla Bolsa
        const [bolsaResult] = await connection.query(
          `INSERT INTO Bolsa (
            id_DepartamentoFK,
            fecha_inicio,
            cantidad_inicial,
            fecha_final
          ) VALUES (?, ?, ?, ?)`,
          [
            departamentoId,
            fechaInicio,
            cantidadPresupuesto,
            fechaFinal
          ]
        );
        
        const bolsaId = bolsaResult.insertId;
        
        // 2. Insertar en la tabla Bolsa_Presupuesto
        await connection.query(
          `INSERT INTO Bolsa_Presupuesto (
            id_BolsaFK
          ) VALUES (?)`,
          [bolsaId]
        );
        
        resultados.push({
          tipo: 'presupuesto',
          id: bolsaId,
          cantidad: cantidadPresupuesto
        });
        
        console.log(`Bolsa de presupuesto creada: ID=${bolsaId}, Cantidad=${cantidadPresupuesto}`);
      }
      
      // Crear bolsa de inversión si se proporcionó una cantidad
      if (cantidadInversion > 0) {
        // 1. Insertar en la tabla Bolsa
        const [bolsaResult] = await connection.query(
          `INSERT INTO Bolsa (
            id_DepartamentoFK,
            fecha_inicio,
            cantidad_inicial,
            fecha_final
          ) VALUES (?, ?, ?, ?)`,
          [
            departamentoId,
            fechaInicio,
            cantidadInversion,
            fechaFinal
          ]
        );
        
        const bolsaId = bolsaResult.insertId;
        
        // 2. Insertar en la tabla Bolsa_Inversion
        await connection.query(
          `INSERT INTO Bolsa_Inversion (
            id_BolsaFK
          ) VALUES (?)`,
          [bolsaId]
        );
        
        resultados.push({
          tipo: 'inversion',
          id: bolsaId,
          cantidad: cantidadInversion
        });
        
        console.log(`Bolsa de inversión creada: ID=${bolsaId}, Cantidad=${cantidadInversion}`);
      }
      
      // Confirmar transacción
      await connection.commit();
      
      return NextResponse.json({
        success: true,
        message: 'Bolsas presupuestarias creadas correctamente',
        resultados
      });
      
    } catch (error) {
      // Revertir transacción en caso de error
      await connection.rollback();
      console.error('Error en la transacción:', error);
      throw error;
    } finally {
      // Liberar conexión
      connection.release();
    }
    
  } catch (error) {
    console.error('Error creando bolsas presupuestarias:', error);
    return NextResponse.json(
      { error: 'Error creando bolsas presupuestarias: ' + error.message },
      { status: 500 }
    );
  }
}