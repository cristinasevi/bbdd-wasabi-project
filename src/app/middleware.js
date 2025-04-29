import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request) {
  // Obtener el token de autenticación
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const isLoginPage = request.nextUrl.pathname === "/pages/login"

  // Si el usuario no está autenticado y no está en la página de login, redirigir a login
  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL("/pages/login", request.url))
  }

  // Si el usuario está autenticado y está en la página de login, redirigir a la página principal
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url))
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
     * 4. /login (página de login)
     * 5. /favicon.ico (favicon)
     */
    "/((?!api/auth|_next|images|login|favicon.ico).*)",
  ],
}
