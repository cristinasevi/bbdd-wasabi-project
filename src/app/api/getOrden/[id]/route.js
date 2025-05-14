// En src/app/api/getOrden/[id]/route.js

import { pool } from '@/app/api/lib/db';

export async function PUT(request, { params }) {
  try {
    const awaitedParams = await params;
    const ordenId = awaitedParams.id;
    const data = await request.json();

    const {
      Num_orden,
      Importe,
      Fecha,
      Descripcion,
      Inventariable,
      Cantidad,
      id_DepartamentoFK,
      id_ProveedorFK,
      id_UsuarioFK,
      id_EstadoOrdenFK,
      Num_inversion,
      id_InversionFK,
      id_PresupuestoFK
    } = data;

    // Iniciar transacción
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Actualizar la orden
      await connection.query(
        `UPDATE Orden 
         SET Num_orden = ?, id_ProveedorFK = ?, id_DepartamentoFK = ?, id_UsuarioFK = ?,
             Importe = ?, Fecha = ?, Descripcion = ?, Inventariable = ?, Cantidad = ?, id_EstadoOrdenFK = ?
         WHERE idOrden = ?`,
        [
          Num_orden,
          id_ProveedorFK,
          id_DepartamentoFK,
          id_UsuarioFK,
          Importe,
          Fecha,
          Descripcion,
          Inventariable,
          Cantidad,
          id_EstadoOrdenFK || 1,
          ordenId
        ]
      );

      // 2. Actualizar o crear relaciones con Orden_Inversion u Orden_Compra según sea necesario
      // Primero, verificar si hay relación existente en Orden_Inversion
      const [inversionExists] = await connection.query(
        `SELECT * FROM Orden_Inversion WHERE idOrden = ?`,
        [ordenId]
      );

      // Y también en Orden_Compra
      const [compraExists] = await connection.query(
        `SELECT * FROM Orden_Compra WHERE idOrden = ?`,
        [ordenId]
      );

      // Si hay inversión, actualizar o crear
      if (Num_inversion) {
        if (inversionExists.length > 0) {
          // Actualizar inversión existente
          await connection.query(
            `UPDATE Orden_Inversion 
             SET id_InversionFK = ?, Num_inversion = ?
             WHERE idOrden = ?`,
            [id_InversionFK, Num_inversion, ordenId]
          );
        } else {
          // Crear nueva inversión
          await connection.query(
            `INSERT INTO Orden_Inversion (idOrden, id_InversionFK, Num_inversion)
             VALUES (?, ?, ?)`,
            [ordenId, id_InversionFK, Num_inversion]
          );

          // Si existía como compra, eliminarla
          if (compraExists.length > 0) {
            await connection.query(
              `DELETE FROM Orden_Compra WHERE idOrden = ?`,
              [ordenId]
            );
          }
        }
      } else if (id_PresupuestoFK) {
        // Es presupuesto (no inversión)
        if (compraExists.length > 0) {
          // Actualizar compra existente
          await connection.query(
            `UPDATE Orden_Compra 
             SET id_PresupuestoFK = ?
             WHERE idOrden = ?`,
            [id_PresupuestoFK, ordenId]
          );
        } else {
          // Crear nueva compra
          await connection.query(
            `INSERT INTO Orden_Compra (idOrden, id_PresupuestoFK)
             VALUES (?, ?)`,
            [ordenId, id_PresupuestoFK]
          );

          // Si existía como inversión, eliminarla
          if (inversionExists.length > 0) {
            await connection.query(
              `DELETE FROM Orden_Inversion WHERE idOrden = ?`,
              [ordenId]
            );
          }
        }
      }

      // Confirmar transacción
      await connection.commit();

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Orden actualizada correctamente" 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      // Si hay error, rollback
      await connection.rollback();
      throw error;
    } finally {
      // Liberar conexión
      connection.release();
    }

  } catch (error) {
    console.error("Error actualizando orden:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "Error al actualizar la orden" 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}