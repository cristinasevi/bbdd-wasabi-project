// File: src/app/api/getUsuarios/[id]/route.js
import { NextResponse } from "next/server";
import { pool } from "@/app/api/lib/db";

// PUT - Actualizar un usuario específico
export async function PUT(request, { params }) {
  try {
    const userId = params.id;
    const userData = await request.json();
    
    // Comenzar una transacción
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // 1. Actualizar la información del usuario
      let query = `
        UPDATE Usuario 
        SET Nombre = ?, Apellidos = ?, Telefono = ?, Direccion = ?, Email = ?, id_RolFK = ?
      `;
      
      let params = [
        userData.Nombre,
        userData.Apellidos,
        userData.Telefono || null,
        userData.Direccion || null,
        userData.Email,
        userData.id_RolFK
      ];
      
      // Si se proporciona una contraseña, actualizarla
      if (userData.Contrasena && userData.Contrasena.trim() !== '') {
        query += `, Contrasena = ?`;
        params.push(userData.Contrasena);
      }
      
      // Completar la query con el WHERE
      query += ` WHERE idUsuario = ?`;
      params.push(userId);
      
      await connection.query(query, params);
      
      // 2. Obtener información del rol
      const [rolResult] = await connection.query('SELECT Tipo FROM Rol WHERE idRol = ?', [userData.id_RolFK]);
      const rolTipo = rolResult[0]?.Tipo;
      
      // 3. Eliminar permisos existentes
      await connection.query('DELETE FROM Permiso WHERE id_UsuarioFK = ?', [userId]);
      
      // 4. Configurar nuevos permisos basados en el rol
      if (rolTipo === 'Administrador') {
        // Admin tiene acceso a todos los departamentos
        const [depts] = await connection.query('SELECT id_Departamento FROM Departamento');
        
        for (const dept of depts) {
          await connection.query(`
            INSERT INTO Permiso (id_UsuarioFK, id_DepFK, Puede_editar, Puede_ver, Fecha_asignacion)
            VALUES (?, ?, 1, 1, CURDATE())
          `, [userId, dept.id_Departamento]);
        }
      } else if (rolTipo === 'Contable') {
        // Contable puede ver todos los departamentos
        const [depts] = await connection.query('SELECT id_Departamento FROM Departamento');
        
        for (const dept of depts) {
          await connection.query(`
            INSERT INTO Permiso (id_UsuarioFK, id_DepFK, Puede_editar, Puede_ver, Fecha_asignacion)
            VALUES (?, ?, 0, 1, CURDATE())
          `, [userId, dept.id_DepFK]);
        }
      } else if (rolTipo === 'Jefe de Departamento') {
        // Jefe tiene acceso solo a su departamento
        // Necesitamos obtener el ID del departamento basado en el nombre
        const [deptResult] = await connection.query('SELECT id_Departamento FROM Departamento WHERE Nombre = ?', [userData.Departamento]);
        
        if (deptResult.length > 0) {
          await connection.query(`
            INSERT INTO Permiso (id_UsuarioFK, id_DepFK, Puede_editar, Puede_ver, Fecha_asignacion)
            VALUES (?, ?, 1, 1, CURDATE())
          `, [userId, deptResult[0].id_Departamento]);
        }
      }
      
      // Confirmar la transacción
      await connection.commit();
      
      return NextResponse.json({ 
        id: userId, 
        message: "Usuario actualizado exitosamente" 
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
    console.error("Error al actualizar usuario:", error);
    return NextResponse.json({ error: "Error al actualizar usuario: " + error.message }, { status: 500 });
  }
}

// GET - Obtener un usuario específico
export async function GET(request, { params }) {
  try {
    const userId = params.id;
    
    const [rows] = await pool.query(`
      SELECT 
        u.idUsuario,
        u.DNI,
        u.Nombre,
        u.Apellidos,
        u.Telefono,
        u.Direccion,
        u.Email,
        u.id_RolFK,
        r.Tipo AS Rol,
        CASE
          WHEN r.Tipo = 'Administrador' THEN 'Admin'
          WHEN r.Tipo = 'Contable' THEN 'Contable'
          ELSE MAX(d.Nombre)
        END AS Departamento
      FROM Usuario u
      JOIN Rol r ON u.id_RolFK = r.idRol
      LEFT JOIN Permiso p ON u.idUsuario = p.id_UsuarioFK
      LEFT JOIN Departamento d ON p.id_DepFK = d.id_Departamento
      WHERE u.idUsuario = ?
      GROUP BY u.idUsuario, u.DNI, u.Nombre, u.Apellidos, u.Telefono, u.Direccion, u.Email, u.id_RolFK, r.Tipo
    `, [userId]);
    
    if (rows.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }
    
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    return NextResponse.json({ error: "Error al obtener usuario" }, { status: 500 });
  }
}

// DELETE - Eliminar un usuario específico
export async function DELETE(request, { params }) {
  try {
    const userId = params.id;
    
    // Comenzar una transacción
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // 1. Eliminar permisos asociados
      await connection.query('DELETE FROM Permiso WHERE id_UsuarioFK = ?', [userId]);
      
      // 2. Eliminar el usuario
      const [result] = await connection.query('DELETE FROM Usuario WHERE idUsuario = ?', [userId]);
      
      // Confirmar la transacción
      await connection.commit();
      
      if (result.affectedRows === 0) {
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
      }
      
      return NextResponse.json({ 
        message: "Usuario eliminado exitosamente" 
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
    console.error("Error al eliminar usuario:", error);
    return NextResponse.json({ error: "Error al eliminar usuario: " + error.message }, { status: 500 });
  }
}