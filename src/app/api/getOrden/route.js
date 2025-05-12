import { pool } from '@/app/api/lib/db'

// En src/app/api/getOrden/route.js
// Busca el método POST y modifica la consulta para incluir id_EstadoOrdenFK

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
      id_EstadoOrdenFK, // Asegúrate de que este parámetro se extraiga
      Num_inversion,    // extra del form
      id_InversionFK,    // extra del form o buscado
      id_PresupuestoFK   // extra del form o buscado
    } = data

    // 1. Insertamos en Orden
    const [ordenResult] = await pool.query(
      `INSERT INTO Orden (
        Num_orden, id_ProveedorFK, id_DepartamentoFK, id_UsuarioFK,
        Importe, Fecha, Descripcion, Inventariable, Cantidad, id_EstadoOrdenFK
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        id_EstadoOrdenFK || 1 // Usar 1 (En proceso) como valor predeterminado si no se proporciona
      ]
    )

    // El resto del código sigue igual...

    const idOrdenNuevo = ordenResult.insertId

    // 2. Insertamos en Orden_Inversion (si hay inversión)
    if (id_InversionFK) {
      await pool.query(
        `INSERT INTO Orden_Inversion (idOrden, id_InversionFK, Num_inversion)
         VALUES (?, ?, ?)`,
        [idOrdenNuevo, id_InversionFK, Num_inversion]
      )
    }

    // 3. Insertamos en Orden_Compra (si hay presupuesto)
    if (id_PresupuestoFK) {
      await pool.query(
        `INSERT INTO Orden_Compra (idOrden, id_PresupuestoFK)
         VALUES (?, ?)`,
        [idOrdenNuevo, id_PresupuestoFK]
      )
    }

    return Response.json({ success: true, insertedId: idOrdenNuevo })
  } catch (err) {
    console.error("Error al insertar orden:", err)
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 })
  }
}
