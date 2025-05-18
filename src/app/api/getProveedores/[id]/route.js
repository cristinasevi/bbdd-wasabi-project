import { NextResponse } from "next/server";
import { pool } from "@/app/api/lib/db";
import { validateNIF, validateEmail, validatePhone } from "@/app/utils/validations";

// PUT - Actualizar un proveedor específico
export async function PUT(request, { params }) {
  try {
    const awaitedParams = await params;
    const proveedorId = awaitedParams.id;
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
    
    // Validar email si se proporciona
    if (data.email) {
      const emailValidation = validateEmail(data.email);
      if (!emailValidation.valid) {
        return NextResponse.json({ 
          error: emailValidation.error 
        }, { status: 400 });
      }
    }
    
    // Validar teléfono si se proporciona
    if (data.telefono) {
      const phoneValidation = validatePhone(data.telefono);
      if (!phoneValidation.valid) {
        return NextResponse.json({ 
          error: phoneValidation.error 
        }, { status: 400 });
      }
    }
    
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
    // Verificar si ya existe otro proveedor con el mismo email (excluyendo el actual)
    if (data.email && data.email.trim()) {
      const [existingEmail] = await connection.query(
        'SELECT idProveedor FROM Proveedor WHERE Email = ? AND idProveedor != ?',
        [data.email.trim().toLowerCase(), proveedorId]
      );
      
      if (existingEmail.length > 0) {
        await connection.rollback();
        return NextResponse.json({ 
          error: "Ya existe otro proveedor con este email" 
        }, { status: 400 });
      }
    }

    // Verificar si ya existe otro proveedor con el mismo teléfono (excluyendo el actual)
    if (data.telefono && data.telefono.trim()) {
      const cleanPhone = data.telefono.replace(/\s/g, '');
      const [existingPhone] = await connection.query(
        'SELECT idProveedor FROM Proveedor WHERE REPLACE(Telefono, " ", "") = ? AND idProveedor != ?',
        [cleanPhone, proveedorId]
      );
      
      if (existingPhone.length > 0) {
        await connection.rollback();
        return NextResponse.json({ 
          error: "Ya existe otro proveedor con este número de teléfono" 
        }, { status: 400 });
      }
    }
      
      const departamentoId = deptResult[0].id_Departamento;
      
      // Actualizar en la tabla Proveedor_Departamento
      const [existingRelation] = await connection.query(
        `SELECT * FROM Proveedor_Departamento WHERE idProveedorFK = ?`,
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
      
      // Manejar errores específicos de la base de datos
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        return NextResponse.json({ 
          error: "Ya existe otro proveedor con este NIF/CIF" 
        }, { status: 400 });
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
    console.error("Error al actualizar proveedor:", error);
    return NextResponse.json(
      { error: "Error al actualizar proveedor: " + error.message },
      { status: 500 }
    );
  }
}