"use client"

import { Inter } from "next/font/google"
import "../../globals.css"
import { useEffect } from "react"

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
    <div>
      
    </div>
  )
}
