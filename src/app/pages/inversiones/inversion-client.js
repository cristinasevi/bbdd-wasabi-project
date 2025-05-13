"use client"

import { useState, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import Link from "next/link"
import useUserDepartamento from "@/app/hooks/useUserDepartamento"

export default function InversionClient({
  initialOrden = [],
  initialDepartamentos = [],
  inversionesPorDepartamento = {},
  inversionesAcumPorDepartamento = {},
  mesActual = "",
  año = ""
}) {
  const { departamento: userDepartamento, isLoading: isLoadingUserDep } = useUserDepartamento()
  
  const [userRole, setUserRole] = useState(null)
  const [departamento, setDepartamento] = useState("")
  const [departamentoId, setDepartamentoId] = useState(null)
  const [orden, setOrden] = useState([])
  const [inversionMensual, setInversionMensual] = useState(0)
  const [gastoMensual, setGastoMensual] = useState(0)
  const [saldoActual, setSaldoActual] = useState(0)
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
  
  // Actualizar ID del departamento cuando cambia el nombre del departamento
  useEffect(() => {
    if (departamento && initialDepartamentos.length > 0) {
      const depInfo = initialDepartamentos.find(dep => dep.Nombre === departamento)
      if (depInfo) {
        setDepartamentoId(depInfo.id_Departamento)
      }
    }
  }, [departamento, initialDepartamentos])
  
  // Cargar datos de inversión cuando cambia el departamento
  useEffect(() => {
    if (!departamentoId) return
    
    try {
      // Filtrar órdenes por departamento
      if (departamento && initialOrden.length > 0) {
        const filteredOrden = initialOrden.filter(o => o.Departamento === departamento && o.Num_inversion)
        setOrden(filteredOrden)
        
        // Cargar datos de inversión para el departamento seleccionado
        const inversionData = inversionesPorDepartamento[departamentoId] || []
        const inversionAcumData = inversionesAcumPorDepartamento[departamentoId] || []
        
        // Calcular inversión mensual
        const invMensual = inversionData[0]?.total_inversion / 12 || 0
        setInversionMensual(invMensual)
        
        // Calcular gasto mensual (usando datos acumulados)
        const gastoAcumulado = inversionAcumData[0]?.Total_Importe || 0
        const mesActualNum = new Date().getMonth() + 1 // 1-12
        const gastoMensualCalc = mesActualNum > 0 ? gastoAcumulado / mesActualNum : 0
        setGastoMensual(gastoMensualCalc)
        
        // Calcular saldo disponible (inversión total anual - gasto acumulado)
        const inversionAnual = inversionData[0]?.total_inversion || 0
        setSaldoActual(inversionAnual - gastoAcumulado)
      }
    } catch (error) {
      console.error("Error cargando datos de inversión:", error)
    }
  }, [departamentoId, departamento, initialOrden, inversionesPorDepartamento, inversionesAcumPorDepartamento])
  
  // Función para cambiar el departamento (solo admin/contable)
  const handleChangeDepartamento = (newDepartamento) => {
    if (userRole === "Jefe de Departamento") return
    
    setDepartamento(newDepartamento)
    
    // Guardar selección en window
    if (typeof window !== 'undefined') {
      window.selectedDepartamento = newDepartamento
    }
  }

  // Formatear valores para mostrar
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "0 €"
    return value.toLocaleString("es-ES") + " €"
  }
  
  if (isLoadingUserDep || isLoading) {
    return <div className="p-6">Cargando...</div>
  }
  
  return (
    <div className="p-6">
      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Inversión</h1>
        <h2 className="text-xl text-gray-400">
          Departamento {departamento || userDepartamento || ""}
        </h2>
      </div>

      {/* Selector y botón de resumen */}
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
                  <div className="text-5xl font-bold">
                    {formatCurrency(saldoActual)}
                  </div>
                </div>
              </div>
            </div>

            {/* Inversión mensual */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-gray-500 mb-2 text-xl">Inversión mensual disponible</h3>
              <div className="text-right">
                <div className="text-5xl font-bold">
                  {formatCurrency(inversionMensual)}
                </div>
              </div>
            </div>

            {/* Gasto mensual */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-gray-500 mb-2 text-xl">Gasto mensual</h3>
              <div className="text-right">
                <div className="text-5xl font-bold text-red-500">
                  {formatCurrency(gastoMensual)}
                </div>
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
                    <th className="pb-2 font-normal text-gray-500">Núm. Inversión</th>
                    <th className="pb-2 font-normal text-gray-500 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orden && orden.length > 0 ? (
                    orden.map((item, index) => (
                      <tr key={`${item.idOrden}-${index}`} className="border-t border-gray-200">
                        <td className="py-2">{item.Num_orden}</td>
                        <td className="py-2">{item.Num_inversion || "-"}</td>
                        <td className="py-2 text-right">{item.Importe}€</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="py-4 text-center text-gray-400">
                        No hay órdenes de inversión registradas
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