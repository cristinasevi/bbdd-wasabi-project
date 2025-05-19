"use client"

import { useState, useMemo } from "react"
import { Calendar, Info } from "lucide-react"
import Link from "next/link"

export default function ResumenClient({ 
  departamento, 
  resumenprep, 
  resumeninv, 
  resumenord, 
  resumengasto, 
  resumeninvacum 
}) {
    // Estados para los filtros de fecha
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    
    const mesActual = meses[new Date().getMonth()];
    const añoActual = new Date().getFullYear();
    
    // Calcular presupuesto actual e inversión actual - CORREGIDO
    const presupuestoTotal = resumenprep?.[0]?.total_presupuesto || 0;
    
    // NUEVO: Calcular gasto en presupuesto sumando todas las órdenes SIN Num_inversion
    const gastoPresupuestoCalculado = useMemo(() => {
        if (!resumenord || resumenord.length === 0) return 0;
        
        // Filtrar órdenes que NO tengan Num_inversion (son de presupuesto, no inversión)
        const ordenesPresupuesto = resumenord.filter(orden => !orden.Num_inversion);
        
        // Sumar todos los importes
        return ordenesPresupuesto.reduce((total, orden) => {
            return total + (parseFloat(orden.Importe) || 0);
        }, 0);
    }, [resumenord]);
    
    // El presupuesto actual es presupuesto total menos gasto acumulado
    const presupuestoActual = presupuestoTotal - gastoPresupuestoCalculado;
    
    const inversionTotal = resumeninv?.[0]?.total_inversion || 0;
    const gastoInversion = resumeninvacum?.[0]?.Total_Importe || 0;
    const inversionActual = inversionTotal - gastoInversion;
    
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

    // Filtrar órdenes solo para el mes actual (sin estados para filtros)
    const filteredOrdenes = useMemo(() => {
        if (!resumenord || resumenord.length === 0) return [];
        
        return resumenord.filter(orden => {
            if (!orden.Fecha) return false;
            
            const ordenDate = new Date(orden.Fecha);
            const ordenMes = meses[ordenDate.getMonth()];
            const ordenAño = ordenDate.getFullYear().toString();
            
            // Solo mostrar órdenes del mes y año actual
            return ordenMes === mesActual && ordenAño === añoActual.toString();
        });
    }, [resumenord, mesActual, añoActual, meses]);

    // Función para formatear fechas
    const formatDate = (dateString) => {
        if (!dateString) return "-";
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            return "-";
        }
    };

    return (
        <div className="p-6">
            {/* Encabezado */}
            <div>
                <h1 className="text-3xl font-bold">Resumen</h1>
                <h2 className="text-xl text-gray-400">Departamento {departamento}</h2>
            </div>

            {/* Fecha */}
            <div className="flex justify-end my-2">
                <div className="relative">
                    <div className="appearance-none bg-gray-100 border border-gray-200 rounded-full px-4 py-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{`${mesActual} ${añoActual}`}</span>
                    </div>
                </div>
            </div>

            {/* Columna izquierda: Tarjetas financieras */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="col-span-1">
                    <div className="grid gap-5">
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
                            <div className="flex justify-between items-center mt-5">
                                <div className="w-full">
                                    <h3 className="text-gray-500 text-mb">Gasto en presupuesto acumulado</h3>
                                    <div className={`text-2xl font-bold ${gastoPresupuestoCalculado > 0 ? "text-red-600" : "text-gray-900"}`}>
                                        {gastoPresupuestoCalculado?.toLocaleString("es-ES", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })} €
                                    </div>
                                </div>
                                <div className={`w-4 h-4 rounded-full ${getIndicatorColor(presupuestoActual, presupuestoTotal)}`}></div>
                            </div>
                        </div>

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
                            <div className="flex justify-between items-center mt-5">
                                <div className="w-full">
                                    <h3 className="text-gray-500 text-mb">Inversión acumulada anual</h3>
                                    <div className={`text-2xl font-bold ${gastoInversion > 0 ? "text-red-600" : "text-gray-900"}`}>
                                        {gastoInversion?.toLocaleString("es-ES", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })} €
                                    </div>
                                </div>
                                <div className={`w-4 h-4 rounded-full ${getIndicatorColor(inversionActual, inversionTotal)}`}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Columna derecha: Órdenes de compra */}
                <div className="col-span-1">
                    <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold">ÓRDENES</h3>
                            <Link href={`/pages/ordenes-compra/`}>
                                <button className="bg-black text-white text-sm px-3 py-1 rounded-md cursor-pointer">
                                    Ver detalles
                                </button>
                            </Link>
                        </div>

                        <div className="overflow-hidden mb-8 max-h-[480px] overflow-y-auto">
                            <table className="w-full table-fixed">
                                <thead className="bg-white sticky top-0 z-10">
                                    <tr>
                                        <th className="pb-2 font-normal text-gray-500 text-left w-1/4">Número</th>
                                        <th className="pb-2 font-normal text-gray-500 text-left w-2/5">Descripción</th>
                                        <th className="pb-2 font-normal text-gray-500 text-left w-1/4">Fecha</th>
                                        <th className="pb-2 font-normal text-gray-500 text-right w-1/5">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                {filteredOrdenes?.length > 0 ? (
                                    filteredOrdenes.map((item) => (
                                    <tr key={`${item.idOrden}`} className="border-t border-gray-200">
                                        <td className="py-3 px-0 text-left w-1/4">
                                            <div className="flex items-center gap-2">
                                                <span>{item.Num_orden}</span>
                                                {item.Inventariable === 1 && item.Num_inversion && (
                                                    <div className="relative group">
                                                        <Info className="w-4 h-4 text-blue-500 cursor-help" />
                                                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10 shadow-lg">
                                                            Número de inversión: {item.Num_inversion}
                                                            <div className="absolute top-full left-3 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-gray-800"></div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-0 text-left w-2/5">
                                            <div className="truncate" title={item.Descripcion}>
                                                {item.Descripcion || "-"}
                                            </div>
                                        </td>
                                        <td className="py-3 px-0 text-left w-1/4">{formatDate(item.Fecha)}</td>
                                        <td className="py-3 px-0 text-right w-1/5">
                                            {parseFloat(item.Importe).toLocaleString("es-ES", {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            })}€
                                        </td>
                                    </tr>
                                    ))
                                ) : (
                                    <tr>
                                    <td colSpan="4" className="py-4 text-center text-gray-400">
                                        No hay órdenes para {mesActual} {añoActual}
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
    );
}