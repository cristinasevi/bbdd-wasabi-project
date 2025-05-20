// src/app/api/createBolsas/route.js
import { pool } from '@/app/api/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();
    const { 
      departamentoId, 
      año, 
      cantidadPresupuesto, 
      cantidadInversion,
      esActualizacion = false // Nuevo parámetro para indicar si es actualización
    } = data;
    
    console.log('API createBolsas: Datos recibidos:', {
      departamentoId, 
      año, 
      cantidadPresupuesto, 
      cantidadInversion,
      esActualizacion
    });
    
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
      // Determinar fechas para el año
      const fechaInicio = `${año}-01-01`;
      const fechaFinal = `${año}-12-31`;
      const resultados = [];
      
      // Si es actualización, eliminar las bolsas existentes para ese año y departamento
      if (esActualizacion) {
        console.log(`Actualizando bolsas para departamento ${departamentoId} y año ${año}`);
        
        // Obtener detalles de las bolsas existentes para mostrar en logs
        const [bolsasExistentes] = await connection.query(
          `SELECT b.id_Bolsa, b.cantidad_inicial, 
           (SELECT COUNT(*) FROM Bolsa_Presupuesto bp WHERE bp.id_BolsaFK = b.id_Bolsa) as es_presupuesto,
           (SELECT COUNT(*) FROM Bolsa_Inversion bi WHERE bi.id_BolsaFK = b.id_Bolsa) as es_inversion
           FROM Bolsa b 
           WHERE b.id_DepartamentoFK = ? AND YEAR(b.fecha_inicio) = ?`,
          [departamentoId, año]
        );
        
        console.log(`Encontradas ${bolsasExistentes.length} bolsas existentes para sustituir:`, 
          bolsasExistentes.map(b => ({
            id: b.id_Bolsa,
            cantidad: b.cantidad_inicial,
            tipo: b.es_presupuesto ? 'presupuesto' : (b.es_inversion ? 'inversión' : 'desconocido')
          }))
        );
        
        if (bolsasExistentes.length > 0) {
          const idsExistentes = bolsasExistentes.map(b => b.id_Bolsa);
          
          // Registrar qué cantidades se están sustituyendo
          console.log("Sustituyendo cantidades:");
          bolsasExistentes.forEach(bolsa => {
            const tipo = bolsa.es_presupuesto ? 'presupuesto' : (bolsa.es_inversion ? 'inversión' : 'desconocido');
            console.log(`- Bolsa ${bolsa.id_Bolsa} (${tipo}): ${bolsa.cantidad_inicial} → ${
              tipo === 'presupuesto' ? cantidadPresupuesto : (tipo === 'inversión' ? cantidadInversion : 'N/A')
            }`);
          });
          
          // 1. Primero, eliminar dependencias en tablas Bolsa_Presupuesto y Bolsa_Inversion
          await connection.query(
            `DELETE FROM Bolsa_Presupuesto WHERE id_BolsaFK IN (?)`,
            [idsExistentes]
          );
          
          await connection.query(
            `DELETE FROM Bolsa_Inversion WHERE id_BolsaFK IN (?)`,
            [idsExistentes]
          );
          
          // 2. Verificar si hay órdenes asociadas a estas bolsas
          const [ordenesAsociadas] = await connection.query(
            `SELECT COUNT(*) as total FROM Orden_Compra WHERE id_PresupuestoFK IN (?)`,
            [idsExistentes]
          );
          
          const [inversionesAsociadas] = await connection.query(
            `SELECT COUNT(*) as total FROM Orden_Inversion WHERE id_InversionFK IN (?)`,
            [idsExistentes]
          );
          
          if (ordenesAsociadas[0].total > 0 || inversionesAsociadas[0].total > 0) {
            console.log(`Advertencia: Hay órdenes asociadas: ${ordenesAsociadas[0].total} compras, ${inversionesAsociadas[0].total} inversiones`);
            
            // Aquí podrías decidir manejar las órdenes de alguna manera especial
            // Por ejemplo, actualizar los montos en las órdenes, o alertar al usuario
            
            // En esta implementación, permitimos la actualización pero dejamos constancia en los logs
          }
          
          // 3. Finalmente eliminar las bolsas
          await connection.query(
            `DELETE FROM Bolsa WHERE id_Bolsa IN (?)`,
            [idsExistentes]
          );
        }
      }
      
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
        
        console.log(`Bolsa de presupuesto ${esActualizacion ? 'actualizada' : 'creada'}: ID=${bolsaId}, Cantidad=${cantidadPresupuesto}`);
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
        
        console.log(`Bolsa de inversión ${esActualizacion ? 'actualizada' : 'creada'}: ID=${bolsaId}, Cantidad=${cantidadInversion}`);
      }
      
      // Confirmar transacción
      await connection.commit();
      
      return NextResponse.json({
        success: true,
        message: esActualizacion 
          ? 'Bolsas presupuestarias actualizadas correctamente' 
          : 'Bolsas presupuestarias creadas correctamente',
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
    console.error(`Error ${error.message || 'desconocido'} en createBolsas:`, error);
    return NextResponse.json(
      { error: `Error ${error.message ? `(${error.message})` : ''} al procesar bolsas presupuestarias` },
      { status: 500 }
    );
  }
}