"use client"

import { Inter } from "next/font/google"
import "../../globals.css"
import { useEffect } from "react"
import Image from "next/image"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

export default function Login() {
  // Este efecto se ejecuta en el cliente para ocultar solo el header y navbar
  useEffect(() => {
    // Ocultar navbar y header, pero mantener el footer
    const navbar = document.querySelector(".w-64.border-r")
    const header = document.querySelector("header")

    if (navbar) navbar.style.display = "none"
    if (header) header.style.display = "none"

    // Ajustar el estilo del contenedor principal para quitar el margen izquierdo
    const mainContainer = document.querySelector(".ml-64")
    if (mainContainer) {
      mainContainer.classList.remove("ml-64")
      mainContainer.classList.add("ml-0")
    }

    // Restaurar todo cuando el componente se desmonte
    return () => {
      if (navbar) navbar.style.display = ""
      if (header) header.style.display = ""

      if (mainContainer) {
        mainContainer.classList.add("ml-64")
        mainContainer.classList.remove("ml-0")
      }
    }
  }, [])

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-full max-w-md p-10 bg-gray-50 rounded-lg shadow-lg">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 relative">
            <Image src="/images/logo-salesianos.png" alt="Salesianos" fill className="object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-gray-600">Iniciar Sesión</h1>
        </div>

        <form className="space-y-6">
          <div>
            <label htmlFor="usuario" className="block text-gray-700 mb-2">
              Usuario
            </label>
            <input
              id="usuario"
              type="text"
              className="w-full bg-white px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label htmlFor="contraseña" className="block text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              id="contraseña"
              type="password"
              className="w-full bg-white px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <button
            type="button"
            onClick={() => (window.location.href = "/")}
            className="w-full bg-red-600 text-white py-3 rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 cursor-pointer"
          >
            Acceder
          </button>
        </form>
      </div>
    </div>
  )
}
