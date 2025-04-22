import { pool } from "@/app/api/lib/db";

export async function getUsuariosConPermisos() {
  try {
    const [rows] = await pool.query(`
      SELECT 
        u.idUsuario,
        u.Nombre,
        u.Apellidos,
        u.Email,
        r.Tipo AS Rol,
        GROUP_CONCAT(
          CASE
            WHEN p.Puede_leer = 1 AND p.Puede_ver = 1 THEN 'ver y editar'
            WHEN p.Puede_ver = 1 THEN 'ver'
            ELSE 'sin permisos'
          END
          SEPARATOR ', '
        ) AS Permisos
      FROM Usuario u
      JOIN Rol r ON u.id_RolFK = r.idRol
      LEFT JOIN Permiso p ON u.idUsuario = p.id_UsuarioFK
      GROUP BY u.idUsuario
    `);
    return rows;
  } catch (error) {
    console.error('Error obteniendo usuarios con permisos:', error);
    throw error;
  }
}

// export async function addUsuario(usuario) {
//     try {
//         const { usuario: nombreUsuario, correo, permisos } = usuario;
//         const [result] = await pool.query("INSERT INTO Usuario (Nombre, Correo, permisos) VALUES (?, ?, ?)", [
//             nombreUsuario,
//             correo,
//             permisos,
//         ]);

//         const id = result.insertId;
//         return { id, ...usuario };
//     } catch (error) {
//         console.error("Error añadiendo usuario:", error);

//         // Si hay un error, simular la creación
//         const usuarios = await getUsuarios();
//         const newId = Math.max(...usuarios.map((u) => u.id)) + 1;
//         return { id: newId, ...usuario };
//     }
// }

// export async function updateUsuarios(usuarios) {
//     try {
//         // Actualizar cada usuario en la base de datos
//         for (const usuario of usuarios) {
//             await pool.query("UPDATE Usuario SET usuario = ?, correo = ?, permisos = ? WHERE id = ?", [
//                 usuario.usuario,
//                 usuario.correo,
//                 usuario.permisos,
//                 usuario.id,
//             ]);
//         }
//     } catch (error) {
//         console.error("Error actualizando usuarios:", error);
//         // En caso de error, simplemente registrarlo
//     }
// }

// export async function deleteUsuarios(ids) {
//     try {
//         // Eliminar usuarios por ID
//         await pool.query("DELETE FROM Usuarios WHERE id IN (?)", [ids]);
//     } catch (error) {
//         console.error("Error eliminando usuarios:", error);
//         // En caso de error, simplemente registrarlo
//     }
// }
