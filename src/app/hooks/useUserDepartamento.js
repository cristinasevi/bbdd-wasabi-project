"use client"

import { useState, useEffect } from 'react'

export default function useUserDepartamento() {
  const [departamento, setDepartamento] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const getUserDepartamento = async () => {
      try {
        // Primero intentamos obtener del global
        if (typeof window !== 'undefined' && window.userDepartamento) {
          setDepartamento(window.userDepartamento)
          setIsLoading(false)
          return
        }

        // Si no está disponible, lo obtenemos de la API
        const res = await fetch('/api/getSessionUser')
        if (res.ok) {
          const data = await res.json()
          const userDept = data.usuario?.departamento || ''
          setDepartamento(userDept)
          
          // Guardarlo globalmente para futuras referencias
          if (typeof window !== 'undefined') {
            window.userDepartamento = userDept
          }
        }
      } catch (error) {
        console.error("Error obteniendo departamento del usuario:", error)
      } finally {
        setIsLoading(false)
      }
    }

    getUserDepartamento()
  }, [])

  return { departamento, isLoading }
}