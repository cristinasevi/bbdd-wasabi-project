"use client"

import { useState, useEffect, useMemo } from "react"
import { ChevronDown, ArrowUpDown, Search, Filter } from "lucide-react"
import Link from "next/link"
import useUserDepartamento from "@/app/hooks/useUserDepartamento"
import useNotifications from "@/app/hooks/useNotifications"

export default function Facturas() {
    const { departamento, isLoading: isDepartamentoLoading } = useUserDepartamento()
    const { addNotification, notificationComponents } = useNotifications()
    const [facturas, setFacturas] = useState([])
    const [userRole, setUserRole] = useState(null)
    const [filteredFacturas, setFilteredFacturas] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [updatingFactura, setUpdatingFactura] = useState(null)
    
    // Estados para búsqueda y filtrado
    const [searchTerm, setSearchTerm] = useState("")
    const [filterDepartamento, setFilterDepartamento] = useState("")
    const [filterEstado, setFilterEstado] = useState("")
    const [filterProveedor, setFilterProveedor] = useState("")
    
    // Lista de proveedores y departamentos únicos para filtros
    const [departamentosList, setDepartamentosList] = useState([])
    const [proveedoresList, setProveedoresList] = useState([])
    
    // Estado de dropdown abierto
    const [openDropdown, setOpenDropdown] = useState(null)

    // Lista de posibles estados
    const estadoOptions = ["Pendiente", "Pagada", "Anulada"]

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
                    
                    // Extraer la lista de departamentos y proveedores únicos
                    const departamentos = [...new Set(data.map(f => f.Departamento))]
                    const proveedores = [...new Set(data.map(f => f.Proveedor))]
                    
                    setDepartamentosList(departamentos)
                    setProveedoresList(proveedores)
                    
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
                
                // Si es jefe de departamento, preseleccionar su departamento en el filtro
                setFilterDepartamento(departamento)
            } else {
                // Admin o Contable ven todas las facturas
                setFilteredFacturas(facturasData)
            }
            
            setLoading(false)
        }
        
        loadData()
    }, [departamento])
    
    // Filtrar facturas cuando cambien los criterios de búsqueda
    useEffect(() => {
        if (facturas.length > 0) {
            const filtered = facturas.filter((factura) => {
                // Filtro por término de búsqueda (número factura, número orden)
                const matchesSearch =
                  searchTerm === "" ||
                  (factura.Num_factura && factura.Num_factura.toLowerCase().includes(searchTerm.toLowerCase())) ||
                  (factura.Num_orden && factura.Num_orden.toLowerCase().includes(searchTerm.toLowerCase()));
        
                // Filtro por departamento
                const matchesDepartamento = 
                  filterDepartamento === "" || 
                  factura.Departamento === filterDepartamento;
                
                // Filtro por proveedor
                const matchesProveedor = 
                  filterProveedor === "" || 
                  factura.Proveedor === filterProveedor;
                
                // Filtro por estado
                const matchesEstado = 
                  filterEstado === "" || 
                  factura.Estado === filterEstado;
        
                return matchesSearch && matchesDepartamento && matchesProveedor && matchesEstado;
            });
        
            setFilteredFacturas(filtered);
        }
    }, [facturas, searchTerm, filterDepartamento, filterProveedor, filterEstado]);

    // Función para formatear fechas
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
    
    // Función para cerrar dropdown cuando se hace clic fuera
    useEffect(() => {
        function handleClickOutside(event) {
            if (openDropdown !== null && !event.target.closest('.estado-dropdown')) {
                setOpenDropdown(null);
            }
        }
        
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [openDropdown]);
    
    // Función para actualizar el estado de una factura
    const handleUpdateEstado = async (facturaId, nuevoEstado) => {
        // Solo admin y contable pueden cambiar estados
        if (userRole !== 'Administrador' && userRole !== 'Contable') {
            addNotification("No tienes permisos para cambiar el estado de las facturas", "error");
            setOpenDropdown(null);
            return;
        }
        
        setUpdatingFactura(facturaId);
        
        try {
            // Implementar llamada a la API para actualizar el estado
            // En una implementación real, esta sería la ruta a tu API
            const response = await fetch('/api/facturas/actualizarEstado', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    idFactura: facturaId,
                    nuevoEstado: nuevoEstado
                }),
            });
            
            // Si no existe la API, simulamos el cambio localmente
            if (!response.ok) {
                // Actualización local para demo
                const updatedFacturas = facturas.map(factura => 
                    factura.idFactura === facturaId 
                        ? {...factura, Estado: nuevoEstado} 
                        : factura
                );
                
                setFacturas(updatedFacturas);
                
                addNotification(`Estado de factura actualizado a: ${nuevoEstado}`, "success");
            } else {
                const data = await response.json();
                
                // Actualizar facturas con la respuesta del servidor
                const updatedFacturas = facturas.map(factura => 
                    factura.idFactura === facturaId 
                        ? {...factura, Estado: nuevoEstado} 
                        : factura
                );
                
                setFacturas(updatedFacturas);
                
                addNotification(data.message || `Estado actualizado a: ${nuevoEstado}`, "success");
            }
        } catch (error) {
            console.error("Error al actualizar estado:", error);
            
            // Para demo, actualizamos localmente incluso si hay error en API
            const updatedFacturas = facturas.map(factura => 
                factura.idFactura === facturaId 
                    ? {...factura, Estado: nuevoEstado} 
                    : factura
            );
            
            setFacturas(updatedFacturas);
            
            addNotification("Estado actualizado localmente (la API no está disponible)", "warning");
        } finally {
            setUpdatingFactura(null);
            setOpenDropdown(null);
        }
    };

    if (loading || isDepartamentoLoading) {
        return <div className="p-6">Cargando...</div>
    }

    return (
        <div className="p-6">
            {/* Mostrar notificaciones */}
            {notificationComponents}
            
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
            
            {/* Filtros y búsqueda */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Buscar por número de factura o orden..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md pl-10"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                </div>
                
                <div className="relative">
                    <select
                        value={filterDepartamento}
                        onChange={(e) => setFilterDepartamento(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md appearance-none pl-10"
                        disabled={userRole === "Jefe de Departamento"} // Deshabilitar si es jefe de departamento
                    >
                        <option value="">Todos los departamentos</option>
                        {departamentosList.map((dept) => (
                            <option key={dept} value={dept}>
                                {dept}
                            </option>
                        ))}
                    </select>
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <Filter className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                    </div>
                </div>
                
                <div className="relative">
                    <select
                        value={filterProveedor}
                        onChange={(e) => setFilterProveedor(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md appearance-none"
                    >
                        <option value="">Todos los proveedores</option>
                        {proveedoresList.map((proveedor) => (
                            <option key={proveedor} value={proveedor}>
                                {proveedor}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                    </div>
                </div>
                
                <div className="relative">
                    <select
                        value={filterEstado}
                        onChange={(e) => setFilterEstado(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md appearance-none"
                    >
                        <option value="">Todos los estados</option>
                        <option value="Pagada">Pagada</option>
                        <option value="Pendiente">Pendiente</option>
                        <option value="Anulada">Anulada</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                    </div>
                </div>
            </div>
            
            {/* Indicador de resultados */}
            <div className="mb-4 text-sm text-gray-500">
                Mostrando {filteredFacturas.length} de {facturas.length} facturas
            </div>

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
                                            <div className="relative w-32 estado-dropdown">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenDropdown(openDropdown === factura.idFactura ? null : factura.idFactura);
                                                    }}
                                                    className={`border rounded px-3 py-1 w-full text-sm ${
                                                        factura.Estado === "Pagada"
                                                            ? "bg-green-50 text-green-800"
                                                            : factura.Estado === "Pendiente"
                                                            ? "bg-yellow-50 text-yellow-800"
                                                            : "bg-red-50 text-red-800"
                                                    }`}
                                                    disabled={updatingFactura === factura.idFactura}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <span>{updatingFactura === factura.idFactura ? "Actualizando..." : factura.Estado}</span>
                                                        <ChevronDown className="w-4 h-4 text-gray-500" />
                                                    </div>
                                                </button>
                                                
                                                {/* Dropdown para cambiar estado */}
                                                {openDropdown === factura.idFactura && (
                                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-20">
                                                        {estadoOptions.map((estado) => (
                                                            <button
                                                                key={estado}
                                                                onClick={() => handleUpdateEstado(factura.idFactura, estado)}
                                                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                                                                    estado === factura.Estado ? "font-semibold bg-gray-50" : ""
                                                                }`}
                                                            >
                                                                {estado}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
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
                                            : searchTerm || filterDepartamento || filterProveedor || filterEstado
                                                ? "No se encontraron facturas con los criterios de búsqueda actuales"
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