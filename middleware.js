import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request) {
  // Obtener el token de autenticación
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const isLoginPage = request.nextUrl.pathname === "/"
  const isHomePage = request.nextUrl.pathname === "/pages/home"

  // Si el usuario no está autenticado y no está en la página de login, redirigir a login
  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // Si el usuario está autenticado y está en la página de login, redirigir a la página principal
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL("/pages/home", request.url))
  }

  // Si es la página de inicio, verificar el rol del usuario
  if (token && isHomePage) {
    try {
      // Hacer una petición a la API para obtener información del usuario
      const userResponse = await fetch(new URL(`/api/getUsuarios/${token.id}`, request.url).toString())
      
      if (userResponse.ok) {
        const userData = await userResponse.json()
        
        // Si es Jefe de Departamento, redirigir al resumen de su departamento
        if (userData.Rol === "Jefe de Departamento" && userData.Departamento) {
          return NextResponse.redirect(
            new URL(`/pages/resumen/${userData.Departamento}`, request.url)
          )
        }
      }
    } catch (error) {
      console.error("Error verificando rol de usuario:", error)
    }
  }

  return NextResponse.next()
}

// Configurar las rutas que deben ser protegidas
export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas excepto:
     * 1. /api/auth (rutas de autenticación)
     * 2. /_next (archivos de Next.js)
     * 3. /images (archivos estáticos)
     * 4. /favicon.ico (favicon)
     */
    "/((?!api/auth|_next|images|favicon.ico).*)",
  ],
}