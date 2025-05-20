"use client"

import { useState, useEffect, useMemo } from "react"
import { ChevronDown, Calendar, Info } from "lucide-react"
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
  const [presupuestoTotal, setPresupuestoTotal] = useState(0)
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
            setDepartamento("Informática")
          } else if (data.usuario?.rol === "Contable") {
            if (typeof window !== 'undefined' && window.selectedDepartamento) {
              setDepartamento(window.selectedDepartamento)
            } else {
              setDepartamento("Informática")
            }
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

  // CORREGIDO: Calcular gasto total del año actual (sin filtro de año)
  const gastoTotalDelAñoActual = useMemo(() => {
    if (!departamento || !initialOrden.length) return 0;

    // Filtrar órdenes del departamento sin inversión y del año actual
    const ordenesDelAño = initialOrden.filter(orden => {
      // Solo órdenes del departamento y que NO tengan número de inversión
      if (orden.Departamento !== departamento || orden.Num_inversion) {
        return false;
      }

      // Solo del año actual
      if (orden.Fecha) {
        const ordenDate = new Date(orden.Fecha);
        const ordenAño = ordenDate.getFullYear();
        return ordenAño === parseInt(selectedAño); // año seleccionado
      }

      return false;
    });

    return ordenesDelAño.reduce((sum, orden) => sum + (parseFloat(orden.Importe) || 0), 0);
  }, [departamento, initialOrden, selectedAño]);

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

  // Cargar datos cuando cambie el departamento
  useEffect(() => {
    if (!departamentoId) return

    try {
      // Obtener datos de presupuesto desde presupuestosPorDepartamento
      const presupuestoData = presupuestosPorDepartamento[departamentoId] || [];

      // CORREGIDO: Usar el presupuesto total anual directamente desde la API
      // Si hay datos en presupuestosPorDepartamento, usar esos datos
      if (presupuestoData.length > 0) {
        const presupMensual = presupuestoData[0]?.presupuesto_mensual || 0;
        setPresupuestoMensual(presupMensual);

        // Calcular presupuesto total anual (12 meses)
        setPresupuestoTotal(presupMensual * 12);
      } else {
        // Si no hay datos, intentar obtener desde gastosPorDepartamento (si existe)
        const gastoData = gastosPorDepartamento[departamentoId] || [];
        // Esto sería un fallback, pero idealmente deberíamos tener los datos de presupuesto
        setPresupuestoMensual(0);
        setPresupuestoTotal(0);
      }
    } catch (error) {
      console.error("Error cargando datos de presupuesto:", error);
    }
  }, [departamentoId, presupuestosPorDepartamento, gastosPorDepartamento]);

  // CORREGIDO: Calcular presupuesto actual = presupuesto total - gasto del año actual
  const presupuestoActual = useMemo(() => {
    return presupuestoTotal - gastoTotalDelAñoActual;
  }, [presupuestoTotal, gastoTotalDelAñoActual]);

  // NUEVO: Calcular presupuesto mensual recomendado basado en lo que queda por gastar
  const presupuestoMensualRecomendado = useMemo(() => {
    // Si no hay presupuesto actual restante, no hay recomendación
    if (presupuestoActual <= 0) return 0;

    // SIEMPRE calcular desde el mes actual hasta diciembre del año actual
    const mesActual = new Date().getMonth() + 1; // JavaScript cuenta desde 0 (enero = 0)
    const mesesRestantes = 12 - mesActual + 1; // +1 para incluir el mes actual

    console.log(`📅 Presupuesto - Mes actual: ${mesActual}, Meses restantes: ${mesesRestantes}`);

    // Evitar división por cero (aunque no debería pasar)
    if (mesesRestantes <= 0) return 0;

    // Calcular recomendación: presupuesto restante / meses restantes del año actual
    const recomendacion = presupuestoActual / mesesRestantes;

    console.log(`💰 Presupuesto restante: ${presupuestoActual}, Meses restantes: ${mesesRestantes}, Recomendación mensual: ${recomendacion}`);

    return recomendacion;
  }, [presupuestoActual]); // Solo depende de presupuestoActual

  // Calcular presupuesto mensual disponible para el mes y año seleccionados
  // CORREGIDO: Calcular presupuesto mensual disponible para el mes específico
  const presupuestoMensualDisponible = useMemo(() => {
    return presupuestoMensualRecomendado - gastoDelMes;
  }, [presupuestoMensualRecomendado, gastoDelMes]);

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

  // En ambos componentes cliente, añadimos esta función y la llamamos cuando cambia el año
  const reloadDataForYear = async (newYear) => {
    if (!departamentoId) return;

    setIsLoading(true);
    try {
      // Cargar datos del año seleccionado para este departamento
      const response = await fetch(`/api/getDataForYear?departamentoId=${departamentoId}&year=${newYear}&type=presupuesto`);
      if (response.ok) {
        const data = await response.json();

        // Para página de presupuestos
        setPresupuestoTotal(data.totalAmount || 0);
        setPresupuestoMensual(data.monthlyAmount || 0);
      }
    } catch (error) {
      console.error(`Error loading budget data for year ${newYear}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  // En el manejador de cambio de año
  const handleAñoChange = (e) => {
    const newYear = e.target.value;
    setSelectedAño(newYear);

    // Recargar datos para el nuevo año
    reloadDataForYear(parseInt(newYear));
  };

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
                    {formatCurrency(presupuestoTotal)}
                  </div>
                </div>
                <div className="w-1/2 pl-4">
                  <h3 className="text-gray-500 mb-2 text-xl">Presupuesto actual</h3>
                  <div className={`text-4xl font-bold ${getTextColorClass(presupuestoActual)}`}>
                    {formatCurrency(presupuestoActual)}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center mt-5">
                <div className="w-full">
                  <h3 className="text-gray-500 text-mb">Gasto acumulado {selectedAño}</h3>
                  <div className={`text-2xl font-bold ${gastoTotalDelAñoActual > 0 ? "text-red-600" : "text-gray-900"}`}>
                    {formatCurrency(gastoTotalDelAñoActual)}
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full ${getIndicatorColor(presupuestoActual, presupuestoTotal)}`}></div>
              </div>
            </div>

            {/* Presupuesto mensual recomendado del mes seleccionado */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-gray-500 text-xl">Presupuesto mensual recomendado</h3>
                <div className="relative group">
                  <Info className="w-4 h-4 text-blue-500 cursor-pointer" />
                  {/* Tooltip explicativo */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-white border border-gray-200 rounded p-3 shadow-lg z-50 w-80">
                    <div className="text-xs">
                      <p className="font-semibold mb-1">Cálculo dinámico:</p>
                      <p className="mb-2">
                        Se divide el presupuesto restante entre los meses que quedan del año actual.
                      </p>
                      <div className="bg-gray-50 p-2 rounded text-xs">
                        <p className="font-mono">
                          {formatCurrency(presupuestoActual)} ÷ {12 - new Date().getMonth()} meses = {formatCurrency(presupuestoMensualRecomendado)}
                        </p>
                      </div>
                      <p className="mt-2 text-gray-600 text-xs">
                        Esto te ayuda a planificar el gasto mensual restante.
                      </p>
                    </div>
                    {/* Flecha apuntando hacia abajo */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-200"></div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-5xl font-bold ${getTextColorClass(presupuestoMensualDisponible)}`}>
                  {formatCurrency(presupuestoMensualDisponible)}
                </div>
              </div>
              <div className="text-sm text-gray-400 mt-2">
                {selectedMes} {selectedAño}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Recomendación: {formatCurrency(presupuestoMensualRecomendado)}/mes
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
                          {formatCurrency(parseFloat(item.Importe))}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="py-4 px-3 text-center text-gray-400">
                        {filteredOrdenes.length === 0 && gastoTotalDelAñoActual > 0
                          ? `No hay órdenes para ${selectedMes} ${selectedAño}`
                          : gastoTotalDelAñoActual === 0
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