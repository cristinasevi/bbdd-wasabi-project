import { NextResponse } from "next/server"
import { getUsuarios, addUsuario, updateUsuarios, deleteUsuarios } from "@/app/api/functions/usuarios"

export async function GET() {
  try {
    const usuarios = await getUsuarios()
    return NextResponse.json(usuarios)
  } catch (error) {
    console.error("Error al obtener usuarios:", error)
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const nuevoUsuario = await request.json()
    const usuarioCreado = await addUsuario(nuevoUsuario)
    return NextResponse.json(usuarioCreado)
  } catch (error) {
    console.error("Error al añadir usuario:", error)
    return NextResponse.json({ error: "Error al añadir usuario" }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const usuarios = await request.json()
    await updateUsuarios(usuarios)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al actualizar usuarios:", error)
    return NextResponse.json({ error: "Error al actualizar usuarios" }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { ids } = await request.json()
    await deleteUsuarios(ids)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al eliminar usuarios:", error)
    return NextResponse.json({ error: "Error al eliminar usuarios" }, { status: 500 })
  }
}
