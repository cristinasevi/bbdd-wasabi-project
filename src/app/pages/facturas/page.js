"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ArrowUpDown } from "lucide-react"
import Link from "next/link"
import useUserDepartamento from "@/app/hooks/useUserDepartamento"

export default function Facturas() {
    const { departamento, isLoading: isDepartamentoLoading } = useUserDepartamento()
    const [facturas, setFacturas] = useState([])
    const [userRole, setUserRole] = useState(null)
    const [filteredFacturas, setFilteredFacturas] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        // Función para obtener el rol del usuario
        async function fetchUserRole() {
            try {
                const response = await fetch('/api/getSessionUser')
                const data = await response.json()
                const role = data.usuario?.rol || ''
                setUserRole(role)
                return role
            } catch (error) {
                console.error("Error obteniendo rol del usuario:", error)
                return null
            }
        }

        // Función para obtener las facturas
        async function fetchFacturas() {
            try {
                const response = await fetch('/api/getFacturas')
                const data = await response.json()
                
                if (Array.isArray(data) && data.length > 0) {
                    setFacturas(data)
                    return data
                } else {
                    console.log("No se encontraron facturas o el formato es incorrecto")
                    setError("No se encontraron facturas")
                    return []
                }
            } catch (error) {
                console.error("Error fetching facturas:", error)
                setError("Error al cargar las facturas: " + error.message)
                return []
            }
        }
        
        // Función principal que coordina todo
        async function loadData() {
            const role = await fetchUserRole()
            const facturasData = await fetchFacturas()
            
            // Filtrar facturas según el rol y departamento
            if ((role === "Jefe de Departamento" || role === "Jefe Departamento") && departamento) {
                // Normalizar nombres para comparación
                const normalizedUserDept = departamento.trim().toLowerCase()
                
                const filtered = facturasData.filter(f => {
                    const facturaDept = f.Departamento?.trim().toLowerCase() || '';
                    return facturaDept === normalizedUserDept;
                })
                
                setFilteredFacturas(filtered)
            } else {
                // Admin o Contable ven todas las facturas
                setFilteredFacturas(facturasData)
            }
            
            setLoading(false)
        }
        
        loadData()
    }, [departamento])

    function formatDate(dateString) {
        if (!dateString) return "-"
    
        if (dateString instanceof Date) {
          return dateString.toLocaleDateString()
        }
        try {
          const date = new Date(dateString)
          return date.toLocaleDateString()
        } catch (error) {
          return dateString
        }
    }

    if (loading || isDepartamentoLoading) {
        return <div className="p-6">Cargando...</div>
    }

    return (
        <div className="p-6">
            {/* Encabezado */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Facturas</h1>
                <h2 className="text-xl text-gray-400">Departamento {departamento}</h2>
            </div>
            
            {/* Estado de error */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Tabla de facturas */}
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-6 max-h-[650px] overflow-y-auto">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr className="border-b border-gray-200">
                                <th className="py-3 px-4 text-left font-medium text-gray-600">Nº Factura</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-600">Proveedor</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-600">Fecha emisión</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-600">Num Orden</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-600">Estado</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-600">Departamento</th>
                                <th className="py-3 px-4 text-center font-medium text-gray-600"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFacturas.length > 0 ? (
                                filteredFacturas.map((factura) => (
                                    <tr key={factura.idFactura} className="border-t border-gray-200">
                                        <td className="py-3 px-4">{factura.Num_factura}</td>
                                        <td className="py-3 px-4">{factura.Proveedor}</td>
                                        <td className="py-3 px-4">{formatDate(factura.Fecha_emision)}</td>
                                        <td className="py-3 px-4">{factura.Num_orden}</td>
                                        <td className="py-3 px-4">
                                            <div className="relative w-32">
                                                <div
                                                    className={`border rounded px-3 py-1 w-full text-sm ${
                                                    factura.Estado === "Pagado"
                                                        ? "bg-green-50 text-green-800"
                                                        : factura.Estado === "Pendiente"
                                                        ? "bg-yellow-50 text-yellow-800"
                                                        : "bg-red-50 text-red-800"
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <span>{factura.Estado}</span>
                                                        <ChevronDown className="w-4 h-4 text-gray-500" />
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                                            {factura.Departamento}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <Link
                                            href={`/api/facturas/descargar?id=${factura.idFactura}`}
                                            className="bg-red-600 text-white text-sm px-3 py-1 rounded hover:bg-red-700"
                                            >
                                            Descargar
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="py-6 text-center text-gray-500">
                                        {userRole === "Jefe de Departamento" 
                                            ? `No se encontraron facturas para el departamento de ${departamento}` 
                                            : "No se encontraron facturas."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}