"use client"

import { useState, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import Link from "next/link"

export default function PresupuestoClient({ 
  initialOrden = [], 
  initialDepartamentos = [], 
  initialPresupuestoMensual = [],
  mesActual = "",
  año = ""
}) {
  const [userRole, setUserRole] = useState(null)
  const [userDepartamento, setUserDepartamento] = useState("")
  const [departamento, setDepartamento] = useState("")
  const [orden, setOrden] = useState(initialOrden)
  const [presupuestoMensual, setPresupuestoMensual] = useState(initialPresupuestoMensual)
  const [isLoading, setIsLoading] = useState(false)
  
  // Obtener información del usuario
  useEffect(() => {
    async function getUserInfo() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/getSessionUser')
        if (response.ok) {
          const data = await response.json()
          setUserRole(data.usuario?.rol || '')
          
          const userDep = data.usuario?.departamento || ''
          setUserDepartamento(userDep)
          
          // Establecer departamento inicial
          if (data.usuario?.rol === "Jefe de Departamento") {
            // Para jefes, usar su departamento asignado
            setDepartamento(userDep)
          } else {
            // Para admin/contable, revisar si hay selección previa
            if (typeof window !== 'undefined' && window.selectedDepartamento) {
              setDepartamento(window.selectedDepartamento)
            } else if (initialDepartamentos.length > 0) {
              // Si no hay selección previa, usar el primer departamento
              setDepartamento(initialDepartamentos[0].Nombre)
            }
          }
        }
      } catch (error) {
        console.error("Error obteniendo información del usuario:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    getUserInfo()
  }, [initialDepartamentos])
  
  // Filtrar órdenes por departamento
  useEffect(() => {
    if (departamento && initialOrden.length > 0) {
      const filteredOrden = initialOrden.filter(o => o.Departamento === departamento)
      setOrden(filteredOrden.length > 0 ? filteredOrden : initialOrden)
    }
  }, [departamento, initialOrden])
  
  // Función para cambiar el departamento (solo para admin/contable)
  const handleChangeDepartamento = (newDepartamento) => {
    if (userRole === "Jefe de Departamento") return
    
    setDepartamento(newDepartamento)
    
    // Guardar selección en window
    if (typeof window !== 'undefined') {
      window.selectedDepartamento = newDepartamento
    }
  }

  return (
    <div className="p-6">
      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Presupuesto</h1>
        <h2 className="text-xl text-gray-400">
          Departamento {departamento || userDepartamento || ""}
        </h2>
      </div>

      {/* Selector de fecha y botón de resumen */}
      <div className="flex justify-between mb-6 gap-4">
        <div className="flex gap-2">
          {/* Selector de departamento (solo para admin/contable) */}
          {userRole && userRole !== "Jefe de Departamento" && initialDepartamentos && initialDepartamentos.length > 0 && (
            <div className="relative">
              <select
                value={departamento}
                onChange={(e) => handleChangeDepartamento(e.target.value)}
                className="appearance-none bg-gray-100 border border-gray-200 rounded-md px-4 py-2 pr-8"
              >
                <option value="">Seleccionar departamento</option>
                {initialDepartamentos.map((dep) => (
                  <option key={dep.id_Departamento} value={dep.Nombre}>
                    {dep.Nombre}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          )}
        </div>
        
        <div className="flex gap-4">
          {/* Selector de mes */}
          <div className="relative">
            <button className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-full px-4 py-2">
              {`${mesActual} ${año}`}
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          
          {/* Botón resumen */}
          {departamento && (
            <Link
              href={`/pages/resumen/${departamento}`}
              className="bg-black text-white px-4 py-2 rounded-full hover:bg-gray-800"
            >
              Resumen
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Columna izquierda: Tarjetas financieras */}
        <div className="col-span-1">
          <div className="grid gap-6">
            {/* Saldo actual */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-gray-500 mb-2 text-xl">Saldo actual</h3>
              <div className="flex justify-between items-center">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <div>
                  <div className="text-5xl font-bold"></div>
                </div>
              </div>
            </div>
            {/* Presupuesto mensual */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-gray-500 mb-2 text-xl">Presupuesto mensual disponible</h3>
              <div className="text-right">
                <div className="text-5xl font-bold">
                  {presupuestoMensual?.[0]?.presupuesto_mensual?.toLocaleString("es-ES") || 0} €
                </div>
              </div>
            </div>

            {/* Gasto mensual */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-gray-500 mb-2 text-xl">Gasto mensual</h3>
              <div className="text-right">
                <div className="text-5xl font-bold text-red-500">0€</div>
              </div>
            </div>

            
          </div>
        </div>

        {/* Columna derecha: Órdenes de compra */}
        <div className="col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg p-6 h-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold">ÓRDENES DE COMPRA</h3>
              <Link href="/pages/ordenes-compra" className="bg-black text-white text-sm px-3 py-1 rounded">
                Ver detalles
              </Link>
            </div>

            <div className="overflow-hidden mb-8 max-h-[480px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-white sticky top-0 z-10">
                  <tr className="text-left">
                    <th className="pb-2 font-normal text-gray-500">Número</th>
                    <th className="pb-2 font-normal text-gray-500 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orden && orden.length > 0 ? (
                    orden.map((item, index) => (
                      <tr key={`${item.idOrden}-${index}`} className="border-t border-gray-200">
                        <td className="py-2">{item.Num_orden}</td>
                        <td className="py-2 text-right">{item.Importe}€</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" className="py-4 text-center text-gray-400">
                        No hay órdenes registradas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}