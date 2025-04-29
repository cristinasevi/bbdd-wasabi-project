//File: src/app/api/getUsuarios/route.js
import { NextResponse } from "next/server";
import { pool } from "@/app/api/lib/db";

// GET - Obtener todos los usuarios con sus roles y permisos
export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT 
        u.idUsuario,
        u.DNI,
        u.Nombre,
        u.Apellidos,
        u.Telefono,
        u.Direccion,
        u.Email,
        r.Tipo AS Rol,
        CASE
          WHEN r.Tipo = 'Administrador' THEN 'Admin'
          WHEN r.Tipo = 'Contable' THEN 'Contable'
          ELSE MAX(d.Nombre)
        END AS Departamento,
        GROUP_CONCAT(
          CASE
            WHEN p.Puede_editar = 1 AND p.Puede_ver = 1 THEN 'ver y editar'
            WHEN p.Puede_ver = 1 THEN 'ver'
            ELSE 'sin permisos'
          END
          SEPARATOR ', '
        ) AS Permisos
      FROM Usuario u
      JOIN Rol r ON u.id_RolFK = r.idRol
      LEFT JOIN Permiso p ON u.idUsuario = p.id_UsuarioFK
      LEFT JOIN Departamento d ON p.id_DepFK = d.id_Departamento
      GROUP BY u.idUsuario, u.DNI, u.Nombre, u.Apellidos, u.Telefono, u.Direccion, u.Email, r.Tipo
    `);
    
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 });
  }
}

// POST - Crear un nuevo usuario
export async function POST(request) {
  try {
    const userData = await request.json();
    
    // Depuración para ver qué datos estamos recibiendo
    console.log("Datos recibidos para crear usuario:", userData);
    
    // Validar que tenemos los datos mínimos necesarios
    if (!userData.DNI || !userData.Nombre || !userData.Apellidos || !userData.Email || !userData.Contrasena || !userData.id_RolFK) {
      return NextResponse.json({ 
        error: "Faltan datos obligatorios para crear el usuario" 
      }, { status: 400 });
    }
    
    // Comenzar una transacción
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // 1. Insertar el usuario
      const [userResult] = await connection.query(`
        INSERT INTO Usuario (DNI, Nombre, Apellidos, Telefono, Direccion, Contrasena, Email, id_RolFK)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userData.DNI,
        userData.Nombre,
        userData.Apellidos,
        userData.Telefono || null,
        userData.Direccion || null,
        userData.Contrasena,
        userData.Email,
        userData.id_RolFK
      ]);
      
      const userId = userResult.insertId;
      
      // 2. Obtener información del rol
      const [rolResult] = await connection.query('SELECT Tipo FROM Rol WHERE idRol = ?', [userData.id_RolFK]);
      const rolTipo = rolResult[0]?.Tipo;
      
      // 3. Configurar permisos basados en el rol
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
          `, [userId, dept.id_Departamento]);
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
        message: "Usuario creado exitosamente" 
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
    console.error("Error al crear usuario:", error);
    return NextResponse.json({ error: "Error al crear usuario: " + error.message }, { status: 500 });
  }
}

// PUT - Actualizar un usuario existente
export async function PUT(request) {
  try {
    const userData = await request.json();
    
    // Obtener el ID del usuario de la URL
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    
    if (!userId) {
      return NextResponse.json({ error: "ID de usuario no proporcionado" }, { status: 400 });
    }
    
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
          `, [userId, dept.id_Departamento]);
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

// DELETE - Eliminar uno o varios usuarios
export async function DELETE(request) {
  try {
    const { ids } = await request.json();
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Se requiere un array de IDs de usuarios" }, { status: 400 });
    }
    
    // Comenzar una transacción
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // 1. Eliminar permisos asociados
      await connection.query('DELETE FROM Permiso WHERE id_UsuarioFK IN (?)', [ids]);
      
      // 2. Eliminar los usuarios
      const [result] = await connection.query('DELETE FROM Usuario WHERE idUsuario IN (?)', [ids]);
      
      // Confirmar la transacción
      await connection.commit();
      
      return NextResponse.json({ 
        deletedCount: result.affectedRows,
        message: `${result.affectedRows} usuario(s) eliminado(s) exitosamente` 
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
    console.error("Error al eliminar usuarios:", error);
    return NextResponse.json({ error: "Error al eliminar usuarios: " + error.message }, { status: 500 });
  }
}