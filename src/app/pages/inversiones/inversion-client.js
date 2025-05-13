"use client"

<<<<<<< Updated upstream
import { useState, useEffect, useMemo } from "react"
=======
import { useState, useEffect } from "react"
>>>>>>> Stashed changes
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
  const { departamento: userDepartamento, isLoading: isLoadingUserDep } = useUserDepartamento()
  
  // Constantes - no cambian entre renderizados
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
  
  const añoActual = new Date().getFullYear()
  const añosLista = Array.from({length: añoActual - 2020 + 1}, (_, i) => (2020 + i).toString())
  
  // Estados básicos
  const [userRole, setUserRole] = useState(null)
  const [departamento, setDepartamento] = useState("")
<<<<<<< Updated upstream
  const [departamentoId, setDepartamentoId] = useState(null)
  const [orden, setOrden] = useState([])
  const [inversionMensual, setInversionMensual] = useState(0)
  const [gastoMensual, setGastoMensual] = useState(0)
  const [saldoActual, setSaldoActual] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  
  // Estados para los filtros de fecha - inicializados con valores actuales
  const [selectedMes, setSelectedMes] = useState(mesActual)
  const [selectedAño, setSelectedAño] = useState(año)
  
  // Obtener información del usuario
=======
  const [loading, setLoading] = useState(true)
  
  // Estados UI para dropdowns
  const [showMesDropdown, setShowMesDropdown] = useState(false)
  const [showAñoDropdown, setShowAñoDropdown] = useState(false)
  
  // Estados de selección
  const [selectedMes, setSelectedMes] = useState(mesActual || meses[new Date().getMonth()])
  const [selectedAño, setSelectedAño] = useState(año || añoActual.toString())
  
  // Obtener información del usuario una sola vez
>>>>>>> Stashed changes
  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const response = await fetch('/api/getSessionUser')
        if (response.ok) {
          const data = await response.json()
          setUserRole(data.usuario?.rol || '')
          
          // Establecer departamento inicial
          if (data.usuario?.rol === "Jefe de Departamento") {
            setDepartamento(data.usuario?.departamento || '')
          } else if (typeof window !== 'undefined' && window.selectedDepartamento) {
            setDepartamento(window.selectedDepartamento)
          } else if (initialDepartamentos.length > 0) {
            setDepartamento(initialDepartamentos[0].Nombre)
          }
        }
      } catch (error) {
        console.error("Error obteniendo información del usuario:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchUserInfo()
  }, [initialDepartamentos])
  
<<<<<<< Updated upstream
  // Actualizar ID del departamento cuando cambia el nombre del departamento
  useEffect(() => {
    if (departamento && initialDepartamentos.length > 0) {
      const depInfo = initialDepartamentos.find(dep => dep.Nombre === departamento)
      if (depInfo) {
        setDepartamentoId(depInfo.id_Departamento)
      }
    }
  }, [departamento, initialDepartamentos])
  
  // Filtrar las órdenes por departamento, mes y año
  const filteredOrdenes = useMemo(() => {
    if (!departamento || !initialOrden.length) return []
    
    return initialOrden.filter(o => {
      // Filtrar por departamento
      const matchesDepartamento = o.Departamento === departamento && o.Num_inversion;
      
      // Filtrar por año
      const ordenDate = new Date(o.Fecha);
      const ordenAño = ordenDate.getFullYear().toString();
      const matchesAño = !selectedAño || ordenAño === selectedAño;
      
      // Filtrar por mes
      const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
      const ordenMes = meses[ordenDate.getMonth()];
      const matchesMes = !selectedMes || ordenMes === selectedMes;
      
      return matchesDepartamento && matchesAño && matchesMes;
    });
  }, [departamento, initialOrden, selectedMes, selectedAño]);
  
  // Obtener los meses y años disponibles basados en las órdenes filtradas por departamento
  const { availableMeses, availableAños } = useMemo(() => {
    const meses = [];
    const años = [];
    
    if (departamento && initialOrden.length) {
      const departamentoOrdenes = initialOrden.filter(o => 
        o.Departamento === departamento && o.Num_inversion
      );
      
      departamentoOrdenes.forEach(orden => {
        const ordenDate = new Date(orden.Fecha);
        const ordenAño = ordenDate.getFullYear().toString();
        const mesesNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                           "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        const ordenMes = mesesNames[ordenDate.getMonth()];
        
        if (!meses.includes(ordenMes)) {
          meses.push(ordenMes);
        }
        
        if (!años.includes(ordenAño)) {
          años.push(ordenAño);
        }
      });
    }
    
    // Ordenar meses en orden cronológico
    const mesesOrder = {
      "Enero": 1, "Febrero": 2, "Marzo": 3, "Abril": 4, "Mayo": 5, "Junio": 6,
      "Julio": 7, "Agosto": 8, "Septiembre": 9, "Octubre": 10, "Noviembre": 11, "Diciembre": 12
    };
    
    meses.sort((a, b) => mesesOrder[a] - mesesOrder[b]);
    años.sort((a, b) => a - b);
    
    return { availableMeses: meses, availableAños: años };
  }, [departamento, initialOrden]);
  
  // Cargar datos de inversión cuando cambia el departamento, mes o año
  useEffect(() => {
    if (!departamentoId) return
    
    try {
      // Actualizar órdenes filtradas
      setOrden(filteredOrdenes);
      
      // Cargar datos de inversión para el departamento seleccionado
      const inversionData = inversionesPorDepartamento[departamentoId] || [];
      const inversionAcumData = inversionesAcumPorDepartamento[departamentoId] || [];
      
      // Calcular inversión mensual
      const invMensual = inversionData[0]?.total_inversion / 12 || 0;
      setInversionMensual(invMensual);
      
      // Calcular gasto mensual (usando datos acumulados)
      const gastoAcumulado = inversionAcumData[0]?.Total_Importe || 0;
      
      // Si hay un mes específico seleccionado, calcular el gasto para ese mes
      if (selectedMes && selectedAño) {
        const mesesNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                           "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        const monthIndex = mesesNames.indexOf(selectedMes);
        
        // Filtrar órdenes por mes y año seleccionados
        const ordenesDelMes = initialOrden.filter(o => {
          if (o.Departamento !== departamento || !o.Num_inversion) return false;
          
          const ordenDate = new Date(o.Fecha);
          return ordenDate.getMonth() === monthIndex && 
                 ordenDate.getFullYear().toString() === selectedAño;
        });
        
        // Calcular el gasto del mes seleccionado
        const gastoDelMes = ordenesDelMes.reduce((sum, o) => sum + (o.Importe || 0), 0);
        setGastoMensual(gastoDelMes);
      } else {
        // Si no hay un mes específico, usar el cálculo original promediado
        const mesActualNum = new Date().getMonth() + 1; // 1-12
        const gastoMensualCalc = mesActualNum > 0 ? gastoAcumulado / mesActualNum : 0;
        setGastoMensual(gastoMensualCalc);
      }
      
      // Calcular saldo disponible (inversión total anual - gasto acumulado)
      const inversionAnual = inversionData[0]?.total_inversion || 0;
      setSaldoActual(inversionAnual - gastoAcumulado);
    } catch (error) {
      console.error("Error cargando datos de inversión:", error);
    }
  }, [departamentoId, departamento, filteredOrdenes, inversionesPorDepartamento, inversionesAcumPorDepartamento, initialOrden, selectedMes, selectedAño]);
  
  // Función para cambiar el departamento (solo admin/contable)
=======
  // Función para cambiar departamento
>>>>>>> Stashed changes
  const handleChangeDepartamento = (newDepartamento) => {
    if (userRole === "Jefe de Departamento") return
    
    setDepartamento(newDepartamento)
    
<<<<<<< Updated upstream
    // Si hay meses y años disponibles, establecer los primeros valores
    if (availableMeses.length > 0) {
      setSelectedMes(availableMeses[0])
    }
    
    if (availableAños.length > 0) {
      setSelectedAño(availableAños[0])
    }
    
    // Guardar selección en window
=======
    // Guardar selección
>>>>>>> Stashed changes
    if (typeof window !== 'undefined') {
      window.selectedDepartamento = newDepartamento
    }
  }
  
<<<<<<< Updated upstream
  // Manejar cambio de mes
  const handleMesChange = (e) => {
    setSelectedMes(e.target.value)
  }
  
  // Manejar cambio de año
  const handleAñoChange = (e) => {
    setSelectedAño(e.target.value)
  }

  // Formatear valores para mostrar
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "0 €"
=======
  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (showMesDropdown && !event.target.closest('.mes-dropdown')) {
        setShowMesDropdown(false)
      }
      if (showAñoDropdown && !event.target.closest('.año-dropdown')) {
        setShowAñoDropdown(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMesDropdown, showAñoDropdown])
  
  // CÁLCULOS DIRECTOS (sin useEffect)
  
  // 1. Filtrar órdenes por departamento y que tengan número de inversión
  const ordenesFiltradas = departamento 
    ? initialOrden.filter(o => o.Departamento === departamento && o.Num_inversion)
    : []
  
  // 2. Calcular valores financieros
  const totalInversion = ordenesFiltradas.reduce((sum, o) => sum + (o.Importe || 0), 0)
  const inversionMensual = totalInversion / 12
  const gastoMensual = totalInversion / 4
  const saldoActual = totalInversion - gastoMensual
  
  // 3. Determinar meses y años disponibles
  const mesesSet = new Set()
  const añosSet = new Set()
  
  ordenesFiltradas.forEach(orden => {
    if (orden.Fecha) {
      const fecha = new Date(orden.Fecha)
      mesesSet.add(fecha.getMonth())
      añosSet.add(fecha.getFullYear().toString())
    }
  })
  
  // Si no hay datos, usar mes y año actuales
  if (mesesSet.size === 0) {
    mesesSet.add(new Date().getMonth())
  }
  
  if (añosSet.size === 0) {
    añosSet.add(new Date().getFullYear().toString())
  }
  
  // Convertir a arrays y ordenar
  const mesesDisponibles = Array.from(mesesSet).map(m => meses[m])
  const añosDisponibles = Array.from(añosSet).sort((a, b) => b - a)
  
  // Utilidades
  const formatCurrency = (value) => {
>>>>>>> Stashed changes
    return value.toLocaleString("es-ES") + " €"
  }
  
  if (isLoadingUserDep || loading) {
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

      {/* Selector y botones de filtro */}
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
<<<<<<< Updated upstream
          <div className="relative">
            <select
              value={selectedMes}
              onChange={handleMesChange}
              className="appearance-none bg-gray-100 border border-gray-200 rounded-md px-4 py-2 pr-8 flex items-center gap-2"
              disabled={availableMeses.length === 0}
            >
              {availableMeses.length > 0 ? (
                availableMeses.map(mes => (
                  <option key={mes} value={mes}>{mes}</option>
                ))
              ) : (
                <option value="">{mesActual}</option>
              )}
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
              className="appearance-none bg-gray-100 border border-gray-200 rounded-md px-4 py-2 pr-8 flex items-center gap-2"
              disabled={availableAños.length === 0}
            >
              {availableAños.length > 0 ? (
                availableAños.map(año => (
                  <option key={año} value={año}>{año}</option>
                ))
              ) : (
                <option value="">{año}</option>
              )}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <Calendar className="w-4 h-4" />
            </div>
=======
          <div className="relative mes-dropdown">
            <button 
              type="button"
              onClick={() => setShowMesDropdown(!showMesDropdown)}
              className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-full px-4 py-2"
            >
              <Calendar className="w-4 h-4" />
              {selectedMes}
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {showMesDropdown && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="py-1 max-h-60 overflow-y-auto">
                  {mesesDisponibles.map((mes) => (
                    <button
                      key={mes}
                      type="button"
                      onClick={() => {
                        setSelectedMes(mes)
                        setShowMesDropdown(false)
                      }}
                      className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${
                        selectedMes === mes ? "bg-gray-100 font-medium" : ""
                      }`}
                    >
                      {mes}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Selector de año */}
          <div className="relative año-dropdown">
            <button 
              type="button"
              onClick={() => setShowAñoDropdown(!showAñoDropdown)}
              className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-full px-4 py-2"
            >
              {selectedAño}
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {showAñoDropdown && (
              <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="py-1 max-h-60 overflow-y-auto">
                  {añosDisponibles.map((año) => (
                    <button
                      key={año}
                      type="button"
                      onClick={() => {
                        setSelectedAño(año)
                        setShowAñoDropdown(false)
                      }}
                      className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${
                        selectedAño === año ? "bg-gray-100 font-medium" : ""
                      }`}
                    >
                      {año}
                    </button>
                  ))}
                </div>
              </div>
            )}
>>>>>>> Stashed changes
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
              <h3 className="text-gray-500 mb-2 text-xl">
                {selectedMes ? `Gasto en ${selectedMes}` : "Gasto mensual"}
                {selectedAño ? ` ${selectedAño}` : ""}
              </h3>
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
                  {ordenesFiltradas.length > 0 ? (
                    ordenesFiltradas.map((item, index) => (
                      <tr key={`${item.idOrden}-${index}`} className="border-t border-gray-200">
                        <td className="py-2">{item.Num_orden}</td>
                        <td className="py-2">{item.Num_inversion || "-"}</td>
                        <td className="py-2 text-right">{item.Importe}€</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="py-4 text-center text-gray-400">
<<<<<<< Updated upstream
                        {selectedMes || selectedAño 
                          ? `No hay órdenes de inversión para ${selectedMes || ''} ${selectedAño || ''}`
                          : "No hay órdenes de inversión registradas"}
=======
                        No hay órdenes de inversión registradas 
                        {selectedMes && selectedAño ? ` para ${selectedMes} de ${selectedAño}` : ""}
>>>>>>> Stashed changes
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