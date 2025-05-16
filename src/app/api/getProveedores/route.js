import { NextResponse } from "next/server";
import { pool } from "@/app/api/lib/db";

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