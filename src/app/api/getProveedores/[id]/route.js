// File: src/app/api/getProveedores/[id]/route.js
import { NextResponse } from "next/server";
import { pool } from "@/app/api/lib/db";

// GET - Obtener un proveedor específico
export async function GET(request, { params }) {
  try {
    const awaitedParams = await params;
    const proveedorId = awaitedParams.id;
    
    const [rows] = await pool.query(`
      SELECT 
        p.idProveedor,
        p.NIF,
        p.Nombre,
        p.Direccion,
        p.Telefono,
        p.Email,
        p.Fecha_alta,
        d.Nombre AS Departamento
      FROM Proveedor p
      JOIN Proveedor_Departamento pd ON p.idProveedor = pd.idProveedorFK
      JOIN Departamento d ON pd.idDepartamentoFK = d.id_Departamento
      WHERE p.idProveedor = ?
    `, [proveedorId]);
    
    if (rows.length === 0) {
      return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 });
    }
    
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Error al obtener proveedor:", error);
    return NextResponse.json({ error: "Error al obtener proveedor" }, { status: 500 });
  }
}

// PUT - Actualizar un proveedor específico
export async function PUT(request, { params }) {
  try {
    const awaitedParams = await params;
    const proveedorId = awaitedParams.id;
    const data = await request.json();
    
    if (!data.nombre || !data.nif || !data.departamento) {
      return NextResponse.json(
        { error: "Nombre, NIF y departamento son campos obligatorios" },
        { status: 400 }
      );
    }
    
    // Comenzar una transacción
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // 1. Actualizar el proveedor
      await connection.query(
        `UPDATE Proveedor 
         SET NIF = ?, Nombre = ?, Direccion = ?, Telefono = ?, Email = ?
         WHERE idProveedor = ?`,
        [data.nif, data.nombre, data.direccion || null, data.telefono || null, data.email || null, proveedorId]
      );
      
      // 2. Obtener el ID del departamento basado en su nombre
      const [deptResult] = await connection.query(
        "SELECT id_Departamento FROM Departamento WHERE Nombre = ?",
        [data.departamento]
      );
      
      if (deptResult.length === 0) {
        throw new Error(`No se encontró el departamento: ${data.departamento}`);
      }
      
      const departamentoId = deptResult[0].id_Departamento;
      
      // 3. Actualizar en la tabla Proveedor_Departamento
      // Primero verificamos si existe una relación
      const [existingRelation] = await connection.query(
        `SELECT * FROM Proveedor_Departamento 
         WHERE idProveedorFK = ?`,
        [proveedorId]
      );
      
      if (existingRelation.length > 0) {
        // Actualizar relación existente
        await connection.query(
          `UPDATE Proveedor_Departamento
           SET idDepartamentoFK = ?
           WHERE idProveedorFK = ?`,
          [departamentoId, proveedorId]
        );
      } else {
        // Crear nueva relación
        await connection.query(
          `INSERT INTO Proveedor_Departamento (idProveedorFK, idDepartamentoFK, Propio, Fecha_vinculacion)
           VALUES (?, ?, 1, CURDATE())`,
          [proveedorId, departamentoId]
        );
      }
      
      // Confirmar la transacción
      await connection.commit();
      
      return NextResponse.json({ 
        id: proveedorId, 
        message: "Proveedor actualizado correctamente" 
      });
      
    } catch (error) {
      // Si hay error, hacer rollback
      await connection.rollback();
      throw error;
    } finally {
      // Liberar la conexión
      connection.release();
    }
    
  } catch (error) {
    console.error("Error al actualizar proveedor:", error);
    return NextResponse.json(
      { error: "Error al actualizar proveedor: " + error.message },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un proveedor específico
export async function DELETE(request, { params }) {
  try {
    const awaitedParams = await params;
    const proveedorId = awaitedParams.id;
    
    // Comenzar una transacción
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // 1. Eliminar relaciones en Proveedor_Departamento
      await connection.query(
        'DELETE FROM Proveedor_Departamento WHERE idProveedorFK = ?',
        [proveedorId]
      );
      
      // 2. Eliminar el proveedor
      const [result] = await connection.query(
        'DELETE FROM Proveedor WHERE idProveedor = ?',
        [proveedorId]
      );
      
      // Confirmar la transacción
      await connection.commit();
      
      if (result.affectedRows === 0) {
        return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 });
      }
      
      return NextResponse.json({ 
        message: "Proveedor eliminado correctamente" 
      });
      
    } catch (error) {
      // Si hay error, hacer rollback
      await connection.rollback();
      throw error;
    } finally {
      // Liberar la conexión
      connection.release();
    }
    
  } catch (error) {
    console.error("Error al eliminar proveedor:", error);
    return NextResponse.json(
      { error: "Error al eliminar proveedor: " + error.message },
      { status: 500 }
    );
  }
}