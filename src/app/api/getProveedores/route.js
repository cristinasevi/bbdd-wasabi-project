import { NextResponse } from "next/server";
import { pool } from "@/app/api/lib/db";

// GET - Obtener todos los proveedores
export async function GET() {
  try {
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
    `);
    
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error al obtener proveedores:", error);
    return NextResponse.json({ error: "Error al obtener proveedores" }, { status: 500 });
  }
}

// POST - Crear un nuevo proveedor
export async function POST(request) {
  try {
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
      // 1. Insertar el proveedor
      const [proveedorResult] = await connection.query(
        `INSERT INTO Proveedor (NIF, Nombre, Direccion, Telefono, Email, Fecha_alta)
         VALUES (?, ?, ?, ?, ?, CURDATE())`,
        [data.nif, data.nombre, data.direccion || null, data.telefono || null, data.email || null]
      );
      
      const proveedorId = proveedorResult.insertId;
      
      // 2. Obtener el ID del departamento basado en su nombre
      const [deptResult] = await connection.query(
        "SELECT id_Departamento FROM Departamento WHERE Nombre = ?",
        [data.departamento]
      );
      
      if (deptResult.length === 0) {
        throw new Error(`No se encontró el departamento: ${data.departamento}`);
      }
      
      const departamentoId = deptResult[0].id_Departamento;
      
      // 3. Insertar en la tabla Proveedor_Departamento
      await connection.query(
        `INSERT INTO Proveedor_Departamento (idProveedorFK, idDepartamentoFK, Propio, Fecha_vinculacion)
         VALUES (?, ?, 1, CURDATE())`,
        [proveedorId, departamentoId]
      );
      
      // Confirmar la transacción
      await connection.commit();
      
      return NextResponse.json({ 
        id: proveedorId,
        message: "Proveedor creado correctamente" 
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
    console.error("Error al crear proveedor:", error);
    return NextResponse.json(
      { error: "Error al crear proveedor: " + error.message },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar proveedores seleccionados
export async function DELETE(request) {
  try {
    const { ids } = await request.json();
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Se requiere un array de IDs de proveedores" },
        { status: 400 }
      );
    }
    
    // Comenzar una transacción
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // 1. Eliminar relaciones en Proveedor_Departamento
      await connection.query(
        'DELETE FROM Proveedor_Departamento WHERE idProveedorFK IN (?)',
        [ids]
      );
      
      // 2. Eliminar proveedores
      const [result] = await connection.query(
        'DELETE FROM Proveedor WHERE idProveedor IN (?)',
        [ids]
      );
      
      // Confirmar la transacción
      await connection.commit();
      
      return NextResponse.json({ 
        deletedCount: result.affectedRows,
        message: `${result.affectedRows} proveedor(es) eliminado(s) exitosamente` 
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
    console.error("Error al eliminar proveedores:", error);
    return NextResponse.json(
      { error: "Error al eliminar proveedores: " + error.message },
      { status: 500 }
    );
  }
}