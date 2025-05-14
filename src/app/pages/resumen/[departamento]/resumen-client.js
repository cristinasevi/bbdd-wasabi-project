"use client"

import { useState, useMemo } from "react"
import { Calendar } from "lucide-react"
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
    
    // Calcular presupuesto actual e inversión actual
    const presupuestoTotal = resumenprep?.[0]?.total_presupuesto || 0;
    const gastoPresupuesto = resumengasto?.[0]?.total_importe || 0;
    const presupuestoActual = presupuestoTotal - gastoPresupuesto;
    
    const inversionTotal = resumeninv?.[0]?.total_inversion || 0;
    const gastoInversion = resumeninvacum?.[0]?.Total_Importe || 0;
    const inversionActual = inversionTotal - gastoInversion;

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
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Resumen</h1>
                <h2 className="text-xl text-gray-400">Departamento {departamento}</h2>
            </div>

            {/* Selector de fecha - SOLO VISUAL, NO FUNCIONAL */}
            <div className="flex justify-end my-4">
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
                    <div className="grid gap-6">
                        {/* Presupuesto total anual */}
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div className="w-1/2 pr-4">
                                    <h3 className="text-gray-500 mb-2 text-xl">Presupuesto total anual</h3>
                                    <div className="text-4xl font-bold text-gray-400">
                                        {presupuestoTotal?.toLocaleString("es-ES")} €
                                    </div>
                                </div>
                                <div className="w-1/2 pl-4">
                                    <h3 className="text-gray-500 mb-2 text-xl">Presupuesto actual</h3>
                                    <div className="text-4xl font-bold">
                                        {presupuestoActual.toLocaleString("es-ES")} €
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                            </div>
                        </div>

                        {/* Inversión total anual */}
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div className="w-1/2 pr-4">
                                    <h3 className="text-gray-500 mb-2 text-xl">Inversión total anual</h3>
                                    <div className="text-4xl font-bold text-gray-400">
                                        {inversionTotal?.toLocaleString("es-ES")} €
                                    </div>
                                </div>
                                <div className="w-1/2 pl-4">
                                    <h3 className="text-gray-500 mb-2 text-xl">Inversión actual</h3>
                                    <div className="text-4xl font-bold">
                                        {inversionActual.toLocaleString("es-ES")} €
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Gasto acumulado anual */}
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            <h3 className="text-gray-500 mb-2 text-xl">Gasto en presupuesto acumulado</h3>
                            <div className="text-4xl font-bold">
                                {gastoPresupuesto?.toLocaleString("es-ES")} €
                            </div>
                        </div>

                        {/* Inversión acumulada anual */}
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            <h3 className="text-gray-500 mb-2 text-xl">Inversión acumulada anual</h3>
                            <div className="text-4xl font-bold">
                                {gastoInversion?.toLocaleString("es-ES")} €
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
                            <table className="w-full">
                                <thead className="bg-white sticky top-0 z-10">
                                    <tr className="text-left">
                                        <th className="pb-2 font-normal text-gray-500">Número</th>
                                        <th className="pb-2 font-normal text-gray-500">Num Inversión</th>
                                        <th className="pb-2 font-normal text-gray-500">Fecha</th>
                                        <th className="pb-2 font-normal text-gray-500 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                {filteredOrdenes?.length > 0 ? (
                                    filteredOrdenes.map((item) => (
                                    <tr key={`${item.idOrden}`} className="border-t border-gray-200">
                                        <td className="py-3 px-4">{item.Num_orden}</td>
                                        <td className="py-3 px-4">{item.Num_inversion || "-"}</td>
                                        <td className="py-3 px-4">{formatDate(item.Fecha)}</td>
                                        <td className="py-3 px-4 text-right">{item.Importe}€</td>
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