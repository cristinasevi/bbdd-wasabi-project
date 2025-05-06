// src/app/api/getOrden/route.js
import { pool } from '@/app/api/lib/db'

// GET - Obtener todas las órdenes
export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT 
        o.idOrden,
        o.Num_orden,
        o.Fecha,
        o.Descripcion,
        o.Inventariable,
        o.Cantidad,
        o.Importe,
        d.Nombre AS Departamento,
        p.Nombre AS Proveedor,
        oi.Num_inversion
      FROM Orden o
      JOIN Departamento d ON o.id_DepartamentoFK = d.id_Departamento
      JOIN Proveedor p ON o.id_ProveedorFK = p.idProveedor
      LEFT JOIN Orden_Inversion oi ON o.idOrden = oi.idOrden
    `);
    
    return Response.json(rows);
  } catch (error) {
    console.error("Error al obtener órdenes:", error);
    return Response.json(
      { success: false, error: "Error al obtener órdenes" }, 
      { status: 500 }
    );
  }
}

// POST - Crear una nueva orden
export async function POST(req) {
  try {
    const data = await req.json()

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
      Num_inversion,    // extra del form
      id_InversionFK,   // para inversión
      id_PresupuestoFK  // para presupuesto
    } = data

    // Iniciar una transacción
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // 1. Insertamos en Orden
      const [ordenResult] = await connection.query(
        `INSERT INTO Orden (
          Num_orden, id_ProveedorFK, id_DepartamentoFK, id_UsuarioFK,
          Importe, Fecha, Descripcion, Inventariable, Cantidad
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Num_orden,
          id_ProveedorFK,
          id_DepartamentoFK,
          id_UsuarioFK,
          Importe,
          Fecha,
          Descripcion,
          Inventariable,
          Cantidad
        ]
      )

      const idOrdenNuevo = ordenResult.insertId

      // 2. Determinar si va a Inversión o Presupuesto
      if (Num_inversion && id_InversionFK) {
        // Es inversión - buscar el ID de Bolsa_Inversion correspondiente
        const [bolsaResult] = await connection.query(
          `SELECT bi.idBolsa 
           FROM Bolsa_Inversion bi
           JOIN Bolsa b ON bi.id_BolsaFK = b.id_Bolsa
           WHERE b.id_DepartamentoFK = ? 
           ORDER BY b.fecha_inicio DESC
           LIMIT 1`,
          [id_DepartamentoFK]
        )
        
        if (bolsaResult.length === 0) {
          throw new Error('No se encontró bolsa de inversión válida para este departamento')
        }
        
        // Insertamos en Orden_Inversion
        await connection.query(
          `INSERT INTO Orden_Inversion (idOrden, id_InversionFK, Num_inversion)
           VALUES (?, ?, ?)`,
          [idOrdenNuevo, bolsaResult[0].idBolsa, Num_inversion]
        )
      } else {
        // Es presupuesto - buscar el ID de Bolsa_Presupuesto correspondiente
        const [bolsaResult] = await connection.query(
          `SELECT bp.idBolsa 
           FROM Bolsa_Presupuesto bp
           JOIN Bolsa b ON bp.id_BolsaFK = b.id_Bolsa
           WHERE b.id_DepartamentoFK = ? 
           ORDER BY b.fecha_inicio DESC
           LIMIT 1`,
          [id_DepartamentoFK]
        )
        
        if (bolsaResult.length === 0) {
          throw new Error('No se encontró bolsa de presupuesto válida para este departamento')
        }
        
        // Insertamos en Orden_Compra
        await connection.query(
          `INSERT INTO Orden_Compra (idOrden, id_PresupuestoFK)
           VALUES (?, ?)`,
          [idOrdenNuevo, bolsaResult[0].idBolsa]
        )
      }

      // Confirmar transacción
      await connection.commit()

      return Response.json({ 
        success: true, 
        insertedId: idOrdenNuevo,
        message: "Orden creada correctamente" 
      })

    } catch (error) {
      // Si hay error, hacer rollback
      await connection.rollback()
      throw error
    } finally {
      // Liberar conexión
      connection.release()
    }
  } catch (err) {
    console.error("Error al insertar orden:", err)
    return Response.json(
      { success: false, error: err.message }, 
      { status: 500 }
    )
  }
}


// DELETE - Eliminar órdenes seleccionadas - Versión corregida
export async function DELETE(req) {
    try {
      const data = await req.json();
      const { ids } = data;
      
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return Response.json(
          { success: false, error: "Se requiere un array de IDs" }, 
          { status: 400 }
        );
      }
      
      // Para debugging
      console.log("IDs a eliminar:", ids);
      
      // Iniciar transacción
      const connection = await pool.getConnection();
      await connection.beginTransaction();
      
      try {
        // Preparar consulta con marcadores de posición individuales
        const placeholders = ids.map(() => '?').join(',');
        
        // Eliminar facturas asociadas
        await connection.query(
          `DELETE FROM Factura WHERE idOrdenFK IN (${placeholders})`,
          ids
        );
        
        // Eliminar de Orden_Inversion
        await connection.query(
          `DELETE FROM Orden_Inversion WHERE idOrden IN (${placeholders})`,
          ids
        );
        
        // Eliminar de Orden_Compra
        await connection.query(
          `DELETE FROM Orden_Compra WHERE idOrden IN (${placeholders})`,
          ids
        );
        
        // Eliminar órdenes
        const [result] = await connection.query(
          `DELETE FROM Orden WHERE idOrden IN (${placeholders})`,
          ids
        );
        
        // Confirmar transacción
        await connection.commit();
        
        return Response.json({ 
          success: true, 
          deletedCount: result.affectedRows,
          message: `${result.affectedRows} orden(es) eliminada(s) correctamente`
        });
        
      } catch (error) {
        // Rollback en caso de error
        await connection.rollback();
        console.error("Error en la transacción:", error);
        throw error;
      } finally {
        // Liberar conexión
        connection.release();
      }
    } catch (err) {
      console.error("Error al eliminar órdenes:", err);
      return Response.json(
        { success: false, error: err.message || "Error al procesar la solicitud" }, 
        { status: 500 }
      );
    }
  }