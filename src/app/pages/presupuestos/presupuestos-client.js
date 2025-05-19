"use client"

import { useState, useEffect, useMemo } from "react"
import { ChevronDown, Calendar } from "lucide-react"
import Link from "next/link"
import useUserDepartamento from "@/app/hooks/useUserDepartamento"

export default function PresupuestoClient({
  initialOrden = [],
  initialDepartamentos = [],
  presupuestosPorDepartamento = {},
  gastosPorDepartamento = {},
  mesActual = "",
  año = ""
}) {
  const { departamento: userDepartamento, isLoading: isDepartamentoLoading } = useUserDepartamento()
  const [userRole, setUserRole] = useState(null)
  const [departamento, setDepartamento] = useState("")
  const [departamentoId, setDepartamentoId] = useState(null)
  const [presupuestoMensual, setPresupuestoMensual] = useState(0)
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
          } else if (data.usuario?.rol === "Administrador") {
            // Siempre establece Informática para el administrador
            setDepartamento("Informática")
          } else if (data.usuario?.rol === "Contable") {
            // Para contable, verifica si hay un departamento guardado, si no, establece Informática
            if (typeof window !== 'undefined' && window.selectedDepartamento) {
              setDepartamento(window.selectedDepartamento)
            } else {
              setDepartamento("Informática")
            }
          } else {
            // Para cualquier otro rol, considera el departamento guardado o el primero
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

  // Filtrar todas las órdenes por departamento (para el cálculo de gastos totales)
  const allDepartmentOrders = useMemo(() => {
    if (!departamento || !initialOrden.length) return [];

    return initialOrden.filter(o => {
      // Solo órdenes del departamento y que NO tengan número de inversión
      return o.Departamento === departamento && !o.Num_inversion;
    });
  }, [departamento, initialOrden]);

  // Filtrar las órdenes por departamento, mes y año (solo presupuesto, no inversión)
  const filteredOrdenes = useMemo(() => {
    if (!departamento || !initialOrden.length) return []

    const filtered = initialOrden.filter(o => {
      // Solo órdenes del departamento y que NO tengan número de inversión
      if (o.Departamento !== departamento || o.Num_inversion) {
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
      // Filtrar solo órdenes del departamento seleccionado sin inversión
      const departamentoOrdenes = initialOrden.filter(o =>
        o.Departamento === departamento && !o.Num_inversion
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

  // Calcular gasto total acumulado (total de todas las órdenes de presupuesto)
  const gastoTotalAcumulado = useMemo(() => {
    // Solo considerar órdenes del año seleccionado
    const ordenesDelAño = allDepartmentOrders.filter(orden => {
      if (!orden.Fecha) return false;
      const ordenDate = new Date(orden.Fecha);
      const ordenAño = ordenDate.getFullYear().toString();
      return ordenAño === selectedAño;
    });

    return ordenesDelAño.reduce((sum, orden) => sum + (parseFloat(orden.Importe) || 0), 0);
  }, [allDepartmentOrders, selectedAño]);

  // Cargar datos cuando cambie el departamento
  useEffect(() => {
    if (!departamentoId) return

    try {
      // Obtener datos de presupuesto
      const presupuestoData = presupuestosPorDepartamento[departamentoId] || [];

      // Calcular presupuesto mensual
      const presupMensual = presupuestoData[0]?.presupuesto_mensual || 0;
      setPresupuestoMensual(presupMensual);
    } catch (error) {
      console.error("Error cargando datos de presupuesto:", error);
    }
  }, [departamentoId, presupuestosPorDepartamento]);

  // Calcular presupuesto anual para el año seleccionado
  const presupuestoAnual = useMemo(() => {
    // Si no hay datos de presupuesto mensual, retornar 0
    if (!presupuestoMensual) return 0;

    // Si el año seleccionado es diferente al año actual, ajustar según la fecha del presupuesto
    const presupuestoData = departamentoId ? presupuestosPorDepartamento[departamentoId] || [] : [];
    const fechaInicio = presupuestoData[0]?.fecha_inicio ? new Date(presupuestoData[0]?.fecha_inicio) : null;
    const fechaFinal = presupuestoData[0]?.fecha_final ? new Date(presupuestoData[0]?.fecha_final) : null;

    // Si no hay fechas o el presupuesto incluye el año seleccionado, usar valor completo
    if (!fechaInicio || !fechaFinal ||
      (fechaInicio.getFullYear() <= parseInt(selectedAño) &&
        fechaFinal.getFullYear() >= parseInt(selectedAño))) {
      return presupuestoMensual * 12;
    }

    // Si no coincide el año, retornar 0
    return 0;
  }, [presupuestoMensual, departamentoId, presupuestosPorDepartamento, selectedAño]);

  // Calcular saldo actual en tiempo real (presupuesto anual - gasto acumulado)
  const saldoActual = useMemo(() => {
    return presupuestoAnual - gastoTotalAcumulado;
  }, [presupuestoAnual, gastoTotalAcumulado]);

  // Calcular presupuesto total (para toda la vigencia del presupuesto)
  const presupuestoTotal = useMemo(() => {
    if (!departamentoId || !presupuestosPorDepartamento[departamentoId]) return 0;

    const presupuestoData = presupuestosPorDepartamento[departamentoId][0];
    return presupuestoData?.total_presupuesto || (presupuestoMensual * 12);
  }, [departamentoId, presupuestosPorDepartamento, presupuestoMensual]);

  // Presupuesto actual es el mismo que saldoActual
  const presupuestoActual = saldoActual;

  // Calcular presupuesto mensual disponible para el mes y año seleccionados
  const presupuestoMensualDisponible = useMemo(() => {
    // Si el año seleccionado es diferente al año del presupuesto, no hay disponible
    const presupuestoData = departamentoId ? presupuestosPorDepartamento[departamentoId] || [] : [];
    const fechaInicio = presupuestoData[0]?.fecha_inicio ? new Date(presupuestoData[0]?.fecha_inicio) : null;
    const fechaFinal = presupuestoData[0]?.fecha_final ? new Date(presupuestoData[0]?.fecha_final) : null;

    // Si no hay fechas o el presupuesto incluye el año y mes seleccionados, calcular disponible
    if (!fechaInicio || !fechaFinal ||
      (fechaInicio.getFullYear() <= parseInt(selectedAño) &&
        fechaFinal.getFullYear() >= parseInt(selectedAño))) {
      return presupuestoMensual - gastoDelMes;
    }

    // Si no coincide el año, no hay disponible
    return 0;
  }, [presupuestoMensual, gastoDelMes, departamentoId, presupuestosPorDepartamento, selectedAño]);

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
            {/* Presupuesto total anual */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="w-1/2 pr-4">
                  <h3 className="text-gray-500 mb-2 text-xl">Presupuesto total anual</h3>
                  <div className="text-4xl font-bold text-gray-400">
                    {presupuestoTotal?.toLocaleString("es-ES", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })} €
                  </div>
                </div>
                <div className="w-1/2 pl-4">
                  <h3 className="text-gray-500 mb-2 text-xl">Presupuesto actual</h3>
                  <div className={`text-4xl font-bold ${getTextColorClass(presupuestoActual)}`}>
                    {presupuestoActual.toLocaleString("es-ES", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })} €
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <div className={`w-4 h-4 rounded-full ${getIndicatorColor(presupuestoActual, presupuestoTotal)}`}></div>
              </div>
            </div>
            {/* Presupuesto mensual disponible del mes seleccionado */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-gray-500 mb-2 text-mb">Presupuesto mensual recomendado</h3>
              <div className="text-right">
                <div className={`text-5xl font-bold ${getTextColorClass(presupuestoMensualDisponible)}`}>
                  {formatCurrency(presupuestoMensualDisponible)}
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
                  <tr className="text-left">
                    <th className="pb-2 font-normal text-gray-500 w-1/3 px-3">Número</th>
                    <th className="pb-2 font-normal text-gray-500 w-1/2 px-3">Descripción</th>
                    <th className="pb-2 font-normal text-gray-500 text-right w-1/6 px-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrdenes && filteredOrdenes.length > 0 ? (
                    filteredOrdenes.map((item, index) => (
                      <tr key={`${item.idOrden}-${index}`} className="border-t border-gray-200">
                        <td className="py-2 px-3 w-1/3">{item.Num_orden}</td>
                        <td className="py-2 w-1/2">
                          <div className="truncate" title={item.Descripcion}>
                            {item.Descripcion || "-"}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right w-1/6">
                          {parseFloat(item.Importe).toLocaleString("es-ES", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                          })}€
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="py-4 px-3 text-center text-gray-400">
                        {filteredOrdenes.length === 0 && allDepartmentOrders.length > 0
                          ? `No hay órdenes para ${selectedMes} ${selectedAño}`
                          : allDepartmentOrders.length === 0
                            ? "No hay órdenes registradas para este departamento"
                            : "No hay órdenes que cumplan con los filtros seleccionados"}
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