import { NextResponse } from "next/server";
import { pool } from "@/app/api/lib/db";
import { validateNIF } from "@/app/utils/validations";

// POST - Crear un nuevo proveedor
export async function POST(request) {
  try {
    const data = await request.json();
    
    // Validar datos obligatorios
    if (!data.nombre || !data.nif || !data.departamento) {
      return NextResponse.json({ 
        error: "Nombre, NIF y departamento son campos obligatorios" 
      }, { status: 400 });
    }
    
    // Validar longitud del nombre
    if (data.nombre.trim().length > 100) {
      return NextResponse.json({ 
        error: "El nombre es demasiado largo (máximo 100 caracteres)" 
      }, { status: 400 });
    }
    
    // Validar NIF/CIF
    const nifValidation = validateNIF(data.nif);
    if (!nifValidation.valid) {
      return NextResponse.json({ 
        error: nifValidation.error 
      }, { status: 400 });
    }
    
    // ELIMINADAS las validaciones de email y teléfono
    
    // Validar dirección
    if (data.direccion && data.direccion.length > 200) {
      return NextResponse.json({ 
        error: "La dirección es demasiado larga (máximo 200 caracteres)" 
      }, { status: 400 });
    }
    
    // Comenzar una transacción
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Verificar si ya existe un proveedor con el mismo NIF
      const [existingProvider] = await connection.query(
        'SELECT idProveedor FROM Proveedor WHERE NIF = ?',
        [nifValidation.formatted]
      );
      
      if (existingProvider.length > 0) {
        await connection.rollback();
        return NextResponse.json({ 
          error: "Ya existe un proveedor con este NIF/CIF" 
        }, { status: 400 });
      }
      
      // Insertar el proveedor
      const [proveedorResult] = await connection.query(`
        INSERT INTO Proveedor (Nombre, NIF, Direccion, Telefono, Email, Fecha_alta)
        VALUES (?, ?, ?, ?, ?, CURDATE())
      `, [
        data.nombre.trim(),
        nifValidation.formatted,
        data.direccion?.trim() || null,
        data.telefono?.trim() || null,
        data.email?.trim().toLowerCase() || null
      ]);
      
      const proveedorId = proveedorResult.insertId;
      
      // Buscar el departamento por nombre
      const [departamentoResult] = await connection.query(
        'SELECT id_Departamento FROM Departamento WHERE Nombre = ?',
        [data.departamento]
      );
      
      if (departamentoResult.length === 0) {
        await connection.rollback();
        return NextResponse.json({ 
          error: "Departamento no encontrado" 
        }, { status: 404 });
      }
      
      const departamentoId = departamentoResult[0].id_Departamento;
      
      // Crear la relación Proveedor_Departamento
      await connection.query(`
        INSERT INTO Proveedor_Departamento (idProveedorFK, idDepartamentoFK, Propio, Fecha_vinculacion)
        VALUES (?, ?, 1, CURDATE())
      `, [proveedorId, departamentoId]);
      
      // Confirmar la transacción
      await connection.commit();
      
      return NextResponse.json({ 
        id: proveedorId, 
        message: "Proveedor creado correctamente" 
      }, { status: 201 });
      
    } catch (error) {
      // Si hay error, hacer rollback
      await connection.rollback();
      
      // Manejar errores específicos de la base de datos
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        // Solo verificar duplicados para NIF
        if (error.message.includes('NIF')) {
          return NextResponse.json({ 
            error: "Ya existe un proveedor con este NIF/CIF" 
          }, { status: 400 });
        } else {
          return NextResponse.json({ 
            error: "Ya existe un proveedor con esos datos" 
          }, { status: 400 });
        }
      }
      
      if (error.code === 'ER_DATA_TOO_LONG' || error.errno === 1406) {
        return NextResponse.json({ 
          error: "Uno de los datos introducidos es demasiado largo para la base de datos" 
        }, { status: 400 });
      }
      
      throw error;
    } finally {
      // Liberar la conexión
      connection.release();
    }
    
  } catch (error) {
    console.error("Error al crear proveedor:", error);
    return NextResponse.json({ 
      error: "Error al crear proveedor: " + error.message 
    }, { status: 500 });
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

// GET - Obtener todos los proveedores
export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT DISTINCT
        p.idProveedor,
        p.Nombre,
        p.NIF,
        p.Direccion,
        p.Telefono,
        p.Email,
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