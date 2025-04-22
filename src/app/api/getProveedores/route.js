import { pool } from "@/app/api/lib/db"

export async function getProveedores() {
  try {
    const [rows] = await pool.query("SELECT * FROM Proveedor")
    return rows
  } catch (error) {
    console.error("Error executing query:", error)
    throw error
  }
}

export async function addProveedor(proveedor) {
  try {
    const { nombre, nif, direccion, telefono, email, departamento } = proveedor
    const [result] = await pool.query(
      "INSERT INTO Proveedor (Nombre, NIF, Direccion, Telefono, Email, Departamento) VALUES (?, ?, ?, ?, ?, ?)",
      [nombre, nif, direccion, telefono, email, departamento],
    )

    return { id: result.insertId, ...proveedor }
  } catch (error) {
    console.error("Error adding proveedor:", error)
    throw error
  }
}

export async function updateProveedor(id, proveedor) {
  try {
    const { nombre, nif, direccion, telefono, email, departamento } = proveedor
    await pool.query(
      "UPDATE Proveedor SET Nombre = ?, NIF = ?, Direccion = ?, Telefono = ?, Email = ?, Departamento = ? WHERE idProveedor = ?",
      [nombre, nif, direccion, telefono, email, departamento, id],
    )

    return { id, ...proveedor }
  } catch (error) {
    console.error("Error updating proveedor:", error)
    throw error
  }
}

export async function deleteProveedor(id) {
  try {
    await pool.query("DELETE FROM Proveedor WHERE idProveedor = ?", [id])
    return true
  } catch (error) {
    console.error("Error deleting proveedor:", error)
    throw error
  }
}
