import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request) {
  try {
    const { usuario, contraseña } = await request.json()

    // Aquí iría la lógica real de autenticación contra una base de datos
    // Por ahora, simulamos un inicio de sesión exitoso con credenciales de ejemplo
    if (usuario === "admin" && contraseña === "admin") {
      // Establecer cookie de sesión
      cookies().set({
        name: "isLoggedIn",
        value: "true",
        httpOnly: true,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 semana
      })

      return NextResponse.json({
        success: true,
        usuario: {
          nombre: "Administrador",
          rol: "admin",
        },
      })
    }

    return NextResponse.json({ success: false, error: "Credenciales inválidas" }, { status: 401 })
  } catch (error) {
    console.error("Error en la autenticación:", error)
    return NextResponse.json({ success: false, error: "Error en el servidor" }, { status: 500 })
  }
}
