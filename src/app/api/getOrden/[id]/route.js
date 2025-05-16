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
      id_EstadoOrdenFK, // Asegurarnos de recibir este campo
      Num_inversion,
      id_InversionFK,
      id_PresupuestoFK
    } = data;

    // Iniciar transacción
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Actualizar la orden - modificamos esta consulta para incluir id_EstadoOrdenFK
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
          id_EstadoOrdenFK, // Usar el ID del estado pasado desde el cliente
          ordenId
        ]
      );

      // El resto de la función permanece igual...
      
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