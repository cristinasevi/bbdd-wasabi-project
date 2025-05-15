"use client"

import { useState, useEffect, useMemo } from "react"
import { ChevronDown, Calendar } from "lucide-react"
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
  const { departamento: userDepartamento, isLoading: isDepartamentoLoading } = useUserDepartamento()
  const [userRole, setUserRole] = useState(null)
  const [departamento, setDepartamento] = useState("")
  const [departamentoId, setDepartamentoId] = useState(null)
  const [inversionMensual, setInversionMensual] = useState(0)
  const [saldoActual, setSaldoActual] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  
  // Estados para los filtros de fecha - inicializados con valores actuales
  const [selectedMes, setSelectedMes] = useState(mesActual)
  const [selectedAño, setSelectedAño] = useState(año.toString())
  
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
            setDepartamento(userDep)
          } else {
            if (typeof window !== 'undefined' && window.selectedDepartamento) {
              setDepartamento(window.selectedDepartamento)
            } else if (initialDepartamentos.length > 0) {
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
  
  // Filtrar las órdenes por departamento, mes y año (solo inversión, CON Num_inversion)
  const filteredOrdenes = useMemo(() => {
    if (!departamento || !initialOrden.length) return []
    
    console.log('Filtering orders...', { departamento, selectedMes, selectedAño });
    
    const filtered = initialOrden.filter(o => {
      // Solo órdenes del departamento y que TENGAN número de inversión
      if (o.Departamento !== departamento || !o.Num_inversion) {
        return false;
      }
      
      // Filtrar por año y mes si están seleccionados
      if (selectedAño || selectedMes) {
        const ordenDate = new Date(o.Fecha);
        const ordenAño = ordenDate.getFullYear().toString();
        const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        const ordenMes = meses[ordenDate.getMonth()];
        
        if (selectedAño && ordenAño !== selectedAño) return false;
        if (selectedMes && ordenMes !== selectedMes) return false;
      }
      
      return true;
    });
    
    console.log('Filtered orders:', filtered.length, filtered);
    return filtered;
  }, [departamento, initialOrden, selectedMes, selectedAño]);
  
  // Obtener los meses y años disponibles
  const { availableMeses, availableAños } = useMemo(() => {
    const mesesSet = new Set();
    const añosSet = new Set();
    
    if (departamento && initialOrden.length) {
      // Filtrar solo órdenes del departamento seleccionado CON inversión
      const departamentoOrdenes = initialOrden.filter(o => 
        o.Departamento === departamento && o.Num_inversion
      );
      
      departamentoOrdenes.forEach(orden => {
        const ordenDate = new Date(orden.Fecha);
        const ordenAño = ordenDate.getFullYear().toString();
        const mesesNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                           "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        const ordenMes = mesesNames[ordenDate.getMonth()];
        
        mesesSet.add(ordenMes);
        añosSet.add(ordenAño);
      });
    }
    
    // Siempre incluir el mes y año actual
    mesesSet.add(mesActual);
    añosSet.add(año.toString());
    
    // Ordenar meses
    const mesesOrder = {
      "Enero": 1, "Febrero": 2, "Marzo": 3, "Abril": 4, "Mayo": 5, "Junio": 6,
      "Julio": 7, "Agosto": 8, "Septiembre": 9, "Octubre": 10, "Noviembre": 11, "Diciembre": 12
    };
    
    const sortedMeses = Array.from(mesesSet).sort((a, b) => mesesOrder[a] - mesesOrder[b]);
    const sortedAños = Array.from(añosSet).sort((a, b) => parseInt(a) - parseInt(b));
    
    return { availableMeses: sortedMeses, availableAños: sortedAños };
  }, [departamento, initialOrden, mesActual, año]);
  
  // Calcular gasto del mes seleccionado
  const gastoDelMes = useMemo(() => {
    return filteredOrdenes.reduce((sum, orden) => sum + (parseFloat(orden.Importe) || 0), 0);
  }, [filteredOrdenes]);
  
  // Cargar datos cuando cambie el departamento
  useEffect(() => {
    if (!departamentoId) return
    
    try {
      // Obtener datos de inversión
      const inversionData = inversionesPorDepartamento[departamentoId] || [];
      const inversionAcumData = inversionesAcumPorDepartamento[departamentoId] || [];
      
      // Calcular inversión mensual
      const invMensual = (inversionData[0]?.total_inversion || 0) / 12;
      setInversionMensual(invMensual);
      
      // Calcular saldo actual (inversión anual - gasto total acumulado)
      const inversionAnual = inversionData[0]?.total_inversion || 0;
      const gastoTotal = inversionAcumData[0]?.Total_Importe || 0;
      setSaldoActual(inversionAnual - gastoTotal);
      
      console.log('Financial data loaded:', {
        invMensual,
        inversionAnual,
        gastoTotal,
        saldoActual: inversionAnual - gastoTotal
      });
    } catch (error) {
      console.error("Error cargando datos de inversión:", error);
    }
  }, [departamentoId, inversionesPorDepartamento, inversionesAcumPorDepartamento]);
  
  // Calcular inversión mensual disponible
  const inversionMensualDisponible = inversionMensual - gastoDelMes;
  
  // Función para cambiar el departamento (solo para admin/contable)
  const handleChangeDepartamento = (newDepartamento) => {
    if (userRole === "Jefe de Departamento") return
    
    setDepartamento(newDepartamento)
    
    // Guardar selección en window
    if (typeof window !== 'undefined') {
      window.selectedDepartamento = newDepartamento
    }
  }
  
  // Manejar cambio de mes
  const handleMesChange = (e) => {
    setSelectedMes(e.target.value)
  }
  
  // Manejar cambio de año
  const handleAñoChange = (e) => {
    setSelectedAño(e.target.value)
  }
  
  // Formatear valores monetarios
  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) return "0,00 €"
    return value.toLocaleString("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + " €"
  }

  if (isDepartamentoLoading || isLoading) {
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
            <select
              value={selectedMes}
              onChange={handleMesChange}
              className="appearance-none bg-gray-100 border border-gray-200 rounded-md px-4 py-2 pr-8"
            >
              {availableMeses.map(mes => (
                <option key={mes} value={mes}>{mes}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          
          {/* Selector de año */}
          <div className="relative">
            <select
              value={selectedAño}
              onChange={handleAñoChange}
              className="appearance-none bg-gray-100 border border-gray-200 rounded-md px-4 py-2 pr-8"
            >
              {availableAños.map(año => (
                <option key={año} value={año}>{año}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <Calendar className="w-4 h-4" />
            </div>
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
                  <div className="text-5xl font-bold">{formatCurrency(saldoActual)}</div>
                </div>
              </div>
            </div>
            
            {/* Inversión mensual disponible del mes seleccionado */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-gray-500 mb-2 text-xl">Inversión mensual disponible</h3>
              <div className="text-right">
                <div className="text-5xl font-bold">
                  {formatCurrency(inversionMensualDisponible)}
                </div>
              </div>
              <div className="text-sm text-gray-400 mt-2">
                {selectedMes} {selectedAño}
              </div>
            </div>

            {/* Gasto del mes seleccionado */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-gray-500 mb-2 text-xl">
                Gasto en {selectedMes} {selectedAño}
              </h3>
              <div className="text-right">
                <div className="text-5xl font-bold text-red-500">{formatCurrency(gastoDelMes)}</div>
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
                  {filteredOrdenes && filteredOrdenes.length > 0 ? (
                    filteredOrdenes.map((item, index) => (
                      <tr key={`${item.idOrden}-${index}`} className="border-t border-gray-200">
                        <td className="py-2">{item.Num_orden}</td>
                        <td className="py-2">{item.Num_inversion || "-"}</td>
                        <td className="py-2 text-right">{item.Importe}€</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="py-4 text-center text-gray-400">
                        {selectedMes && selectedAño 
                          ? `No hay órdenes de inversión para ${selectedMes} ${selectedAño}`
                          : "No hay órdenes de inversión registradas"}
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