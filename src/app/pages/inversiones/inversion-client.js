"use client"

import { useState, useEffect, useMemo } from "react"
import { ChevronDown, Calendar, Info } from "lucide-react"
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

          // Establecer departamento inicial según el rol
          if (data.usuario?.rol === "Jefe de Departamento") {
            // Para Jefe de Departamento, usar su propio departamento
            setDepartamento(userDep)
          } else if (data.usuario?.rol === "Administrador") {
            // Para Admin, establecer siempre Informática por defecto
            const informaticaDep = initialDepartamentos.find(dep => dep.Nombre === "Informática")
            if (informaticaDep) {
              setDepartamento("Informática")
            } else if (initialDepartamentos.length > 0) {
              // Si no hay departamento Informática, usar el primero
              setDepartamento(initialDepartamentos[0].Nombre)
            }
          } else if (data.usuario?.rol === "Contable") {
            // Para Contable, verificar si hay una selección guardada
            const savedDep = typeof window !== 'undefined' && window.selectedDepartamento

            if (savedDep) {
              // Verificar que el departamento guardado existe
              const depExists = initialDepartamentos.some(dep => dep.Nombre === savedDep)
              if (depExists) {
                setDepartamento(savedDep)
              } else if (initialDepartamentos.length > 0) {
                // Si no es válido, usar Informática o el primero
                const informaticaDep = initialDepartamentos.find(dep => dep.Nombre === "Informática")
                setDepartamento(informaticaDep ? "Informática" : initialDepartamentos[0].Nombre)
              }
            } else if (initialDepartamentos.length > 0) {
              // Sin selección guardada, establecer Informática o el primero
              const informaticaDep = initialDepartamentos.find(dep => dep.Nombre === "Informática")
              setDepartamento(informaticaDep ? "Informática" : initialDepartamentos[0].Nombre)
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

  // Filtrar todas las órdenes de inversión por departamento (para cálculo de gastos totales)
  const allInvestmentOrders = useMemo(() => {
    if (!departamento || !initialOrden.length) return [];

    return initialOrden.filter(o => {
      // Solo órdenes del departamento y que sí tengan número de inversión
      return o.Departamento === departamento && o.Num_inversion;
    });
  }, [departamento, initialOrden]);

  // Filtrar las órdenes por departamento, mes y año (solo inversión, CON Num_inversion)
  const filteredOrdenes = useMemo(() => {
    if (!departamento || !initialOrden.length) return []

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

  // Calcular gasto total acumulado en inversiones (todas las órdenes de inversión)
  const gastoTotalInversion = useMemo(() => {
    // Solo considerar órdenes del año seleccionado
    const ordenesDelAño = allInvestmentOrders.filter(orden => {
      if (!orden.Fecha) return false;
      const ordenDate = new Date(orden.Fecha);
      const ordenAño = ordenDate.getFullYear().toString();
      return ordenAño === selectedAño;
    });

    return ordenesDelAño.reduce((sum, orden) => sum + (parseFloat(orden.Importe) || 0), 0);
  }, [allInvestmentOrders, selectedAño]);

  // Cargar datos cuando cambie el departamento o el año seleccionado
  useEffect(() => {
    if (!departamentoId) return

    try {
      // Obtener datos de inversión
      const inversionData = inversionesPorDepartamento[departamentoId] || [];

      // Verificar si la inversión aplica para el año seleccionado
      const fechaInicio = inversionData[0]?.fecha_inicio ? new Date(inversionData[0]?.fecha_inicio) : null;
      const fechaFinal = inversionData[0]?.fecha_final ? new Date(inversionData[0]?.fecha_final) : null;

      // Si no hay fechas o la inversión incluye el año seleccionado, calcular valor
      if (!fechaInicio || !fechaFinal ||
        (fechaInicio.getFullYear() <= parseInt(selectedAño) &&
          fechaFinal.getFullYear() >= parseInt(selectedAño))) {
        // Calcular inversión mensual
        const invMensual = (inversionData[0]?.total_inversion || 0) / 12;
        setInversionMensual(invMensual);
      } else {
        // Si el año seleccionado está fuera del rango, establecer a 0
        setInversionMensual(0);
      }
    } catch (error) {
      console.error("Error cargando datos de inversión:", error);
    }
  }, [departamentoId, inversionesPorDepartamento, selectedAño]);

  // Calcular inversión total anual para el año seleccionado
  const inversionTotalAnual = useMemo(() => {
    const inversionData = inversionesPorDepartamento[departamentoId] || [];
    const total = inversionData[0]?.total_inversion || 0;

    // Verificar si la inversión aplica para el año seleccionado
    const fechaInicio = inversionData[0]?.fecha_inicio ? new Date(inversionData[0]?.fecha_inicio) : null;
    const fechaFinal = inversionData[0]?.fecha_final ? new Date(inversionData[0]?.fecha_final) : null;

    // Si no hay fechas o la inversión incluye el año seleccionado, usar el valor completo
    if (!fechaInicio || !fechaFinal ||
      (fechaInicio.getFullYear() <= parseInt(selectedAño) &&
        fechaFinal.getFullYear() >= parseInt(selectedAño))) {
      return total;
    }

    // Si no coincide el año, retornar 0
    return 0;
  }, [inversionesPorDepartamento, departamentoId, selectedAño]);

  // Calcular saldo actual en tiempo real (inversión total - gasto acumulado)
  const saldoActual = useMemo(() => {
    return inversionTotalAnual - gastoTotalInversion;
  }, [inversionTotalAnual, gastoTotalInversion]);

  const inversionTotal = inversionTotalAnual; // Total disponible para el año
  const inversionActual = saldoActual; // Lo que queda disponible (total - gastado)

  // Calcular inversión mensual disponible para el mes y año seleccionados
  const inversionMensualDisponible = useMemo(() => {
    // Verificar si la inversión aplica para el año y mes seleccionados
    const inversionData = inversionesPorDepartamento[departamentoId] || [];
    const fechaInicio = inversionData[0]?.fecha_inicio ? new Date(inversionData[0]?.fecha_inicio) : null;
    const fechaFinal = inversionData[0]?.fecha_final ? new Date(inversionData[0]?.fecha_final) : null;

    // Si no hay fechas o la inversión incluye el año seleccionado, calcular disponible
    if (!fechaInicio || !fechaFinal ||
      (fechaInicio.getFullYear() <= parseInt(selectedAño) &&
        fechaFinal.getFullYear() >= parseInt(selectedAño))) {
      return inversionMensual - gastoDelMes;
    }

    // Si no coincide el año, no hay disponible
    return 0;
  }, [inversionMensual, gastoDelMes, departamentoId, inversionesPorDepartamento, selectedAño]);

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

  // Determinar el color del indicador según el saldo restante
  const getIndicatorColor = (actual, total) => {
    if (!total) return "bg-gray-400"; // Si no hay total, gris

    const porcentaje = (actual / total) * 100;

    if (porcentaje < 25) return "bg-red-500";      // Menos del 25% - Rojo
    if (porcentaje < 50) return "bg-yellow-500";   // Entre 25% y 50% - Amarillo
    return "bg-green-500";                         // Más del 50% - Verde
  };

  // Determinar el color del texto para valores negativos
  const getTextColorClass = (valor) => {
    return valor < 0 ? "text-red-600" : "";
  };

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
                className="appearance-none bg-gray-100 border border-gray-200 rounded-md px-4 py-2 pr-8 cursor-pointer"
              >
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
              className="appearance-none bg-gray-100 border border-gray-200 rounded-md px-4 py-2 pr-8 cursor-pointer"
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
              className="appearance-none bg-gray-100 border border-gray-200 rounded-md px-4 py-2 pr-8 cursor-pointer"
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
            {/* Inversión total anual */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="w-1/2 pr-4">
                  <h3 className="text-gray-500 mb-2 text-xl">Inversión total anual</h3>
                  <div className="text-4xl font-bold text-gray-400">
                    {inversionTotal?.toLocaleString("es-ES", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })} €
                  </div>
                </div>
                <div className="w-1/2 pl-4">
                  <h3 className="text-gray-500 mb-2 text-xl">Inversión actual</h3>
                  <div className={`text-4xl font-bold ${getTextColorClass(inversionActual)}`}>
                    {inversionActual.toLocaleString("es-ES", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })} €
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <div className={`w-4 h-4 rounded-full ${getIndicatorColor(inversionActual, inversionTotal)}`}></div>
              </div>
            </div>

            {/* Inversión mensual disponible del mes seleccionado */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-gray-500 mb-2 text-xl">Inversión mensual disponible</h3>
              <div className="text-right">
                <div className={`text-5xl font-bold ${getTextColorClass(inversionMensualDisponible)}`}>
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
                <div className={`text-5xl font-bold ${gastoDelMes > 0 ? "text-red-500" : "text-gray-900"}`}>
                  {formatCurrency(gastoDelMes)}
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

            <div className="overflow-hidden max-h-[480px] overflow-y-auto">
              <table className="w-full table-fixed">
                <thead className="bg-white sticky top-0 z-10">
                  <tr>
                    <th className="pb-2 font-normal text-gray-500 text-left w-1/3">Número</th>
                    <th className="pb-2 font-normal text-gray-500 text-left w-1/2">Descripción</th>
                    <th className="pb-2 font-normal text-gray-500 text-right w-1/6">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrdenes && filteredOrdenes.length > 0 ? (
                    filteredOrdenes.map((item, index) => (
                      <tr key={`${item.idOrden}-${index}`} className="border-t border-gray-200">
                        {/* Número de Orden con tooltip para Inversión */}
                        <td className="py-3 w-1/3">
                          <div className="flex items-center">
                            <span className="truncate max-w-[120px]" title={item.Num_orden}>{item.Num_orden}</span>
                            {item.Num_inversion && (
                              <div className="ml-2 relative group">
                                <Info className="h-4 w-4 text-blue-500" />

                                {/* Tooltip que aparece hacia arriba para evitar scroll */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-white border border-gray-200 rounded p-3 shadow-lg whitespace-nowrap z-50">
                                  <div className="text-xs">
                                    <p className="font-semibold">Núm. Inversión:</p>
                                    <p>{item.Num_inversion}</p>
                                  </div>
                                  {/* Flecha apuntando hacia abajo */}
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-200"></div>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 w-1/2">
                          <div className="truncate pr-2" title={item.Descripcion}>
                            {item.Descripcion || "-"}
                          </div>
                        </td>
                        <td className="py-3 text-right w-1/6">
                          {parseFloat(item.Importe || 0).toLocaleString("es-ES", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}€
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="py-4 text-center text-gray-400">
                        {filteredOrdenes.length === 0 && allInvestmentOrders.length > 0
                          ? `No hay órdenes de inversión para ${selectedMes} ${selectedAño}`
                          : allInvestmentOrders.length === 0
                            ? "No hay órdenes de inversión registradas para este departamento"
                            : "No hay órdenes de inversión que cumplan con los filtros seleccionados"}
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