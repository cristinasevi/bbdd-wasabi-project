"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { ChevronDown, ArrowUpDown, Search, Filter, Upload, X, Pencil, Calendar, Euro, Download } from "lucide-react"
import Link from "next/link"
import useUserDepartamento from "@/app/hooks/useUserDepartamento"
import useNotifications from "@/app/hooks/useNotifications"

export default function Facturas() {
    const { departamento, isLoading: isDepartamentoLoading } = useUserDepartamento()
    const { addNotification, notificationComponents } = useNotifications()
    const [facturas, setFacturas] = useState([])
    const [userRole, setUserRole] = useState(null)
    const [filteredFacturas, setFilteredFacturas] = useState([])
    const [loading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [updatingFactura, setUpdatingFactura] = useState(null)
    
    // Estados para búsqueda y filtrado
    const [searchTerm, setSearchTerm] = useState("")
    const [filterFecha, setFilterFecha] = useState("")
    const [filterImporte, setFilterImporte] = useState("")
    const [filterEstado, setFilterEstado] = useState("")
    const [filterProveedor, setFilterProveedor] = useState("")
    
    // Lista de proveedores y departamentos únicos para filtros
    const [departamentosList, setDepartamentosList] = useState([])
    const [proveedoresList, setProveedoresList] = useState([])
    
    // Estado de dropdown abierto
    const [openDropdown, setOpenDropdown] = useState(null)

    // Estado para selección de facturas
    const [selectedFacturas, setSelectedFacturas] = useState([])

    // Estado para modal de subir factura
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [selectedFacturaId, setSelectedFacturaId] = useState(null)
    const [selectedFile, setSelectedFile] = useState(null)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [isUploading, setIsUploading] = useState(false)
    
    // Estado para modal de edición de factura
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingFactura, setEditingFactura] = useState(null)
    const [formFactura, setFormFactura] = useState({
        num_factura: "",
        fecha_emision: "",
        estado: "",
        ruta_pdf: "",
        importe: "",
        // Mantenemos los campos no editables para referencia
        idFactura: null,
        num_orden: "",
        proveedor: "",
        departamento: "",
        // Control de archivo nuevo
        newFile: null,
        hasNewFile: false
    })
    
    // Referencia al input de archivo
    const fileInputRef = useRef(null)
    const editFileInputRef = useRef(null)

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
            } else {
                // Admin o Contable ven todas las facturas
                setFilteredFacturas(facturasData)
            }
            
            setIsLoading(false)
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
        
                // Filtro por fecha
                let matchesFecha = true;
                if (filterFecha) {
                    const filterDate = new Date(filterFecha);
                    const facturaDate = factura.Fecha_emision ? new Date(factura.Fecha_emision) : null;
                    
                    if (facturaDate) {
                        // Comparar solo año, mes y día
                        matchesFecha = 
                            filterDate.getFullYear() === facturaDate.getFullYear() &&
                            filterDate.getMonth() === facturaDate.getMonth() &&
                            filterDate.getDate() === facturaDate.getDate();
                    } else {
                        matchesFecha = false;
                    }
                }
                
                // Filtro por importe
                let matchesImporte = true;
                if (filterImporte && factura.Importe !== undefined) {
                    const importe = parseFloat(factura.Importe);
                    
                    switch (filterImporte) {
                        case "0-500":
                            matchesImporte = importe < 500;
                            break;
                        case "500-1000":
                            matchesImporte = importe >= 500 && importe < 1000;
                            break;
                        case "1000-5000":
                            matchesImporte = importe >= 1000 && importe < 5000;
                            break;
                        case "5000+":
                            matchesImporte = importe >= 5000;
                            break;
                        default:
                            matchesImporte = true;
                    }
                }
                
                // Filtro por proveedor
                const matchesProveedor = 
                  filterProveedor === "" || 
                  factura.Proveedor === filterProveedor;
                
                // Filtro por estado
                const matchesEstado = 
                  filterEstado === "" || 
                  factura.Estado === filterEstado;
        
                return matchesSearch && matchesFecha && matchesImporte && matchesProveedor && matchesEstado;
            });
        
            setFilteredFacturas(filtered);
        }
    }, [facturas, searchTerm, filterFecha, filterImporte, filterProveedor, filterEstado]);
    
    // Función para formatear fechas para mostrar
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
    
    // Función para formatear fechas para input type="date"
    function formatDateForInput(dateString) {
        if (!dateString) return ""
        
        try {
            const date = new Date(dateString)
            return date.toISOString().split('T')[0]
        } catch (error) {
            return ""
        }
    }
    
    // Seleccionar o deseleccionar una factura
    const toggleSelectFactura = (facturaId) => {
        if (selectedFacturas.includes(facturaId)) {
            setSelectedFacturas(selectedFacturas.filter(id => id !== facturaId))
        } else {
            setSelectedFacturas([...selectedFacturas, facturaId])
        }
    }
    
    // Seleccionar/deseleccionar todas las facturas
    const toggleSelectAll = () => {
        if (selectedFacturas.length === filteredFacturas.length) {
            setSelectedFacturas([])
        } else {
            setSelectedFacturas(filteredFacturas.map(f => f.idFactura))
        }
    }
    
    // Función para descargar facturas seleccionadas
    const handleDescargarSeleccionadas = () => {
        if (selectedFacturas.length === 0) {
            addNotification("Por favor, selecciona al menos una factura", "warning")
            return
        }
        
        // En una implementación real, esto podría manejar descargas múltiples o crear un zip
        if (selectedFacturas.length === 1) {
            // Descargar la única factura seleccionada
            const facturaId = selectedFacturas[0]
            window.open(`/api/facturas/descargar?id=${facturaId}`, '_blank')
        } else {
            // Para múltiples facturas en producción deberías crear un endpoint que agrupe los PDFs
            addNotification("Descargando " + selectedFacturas.length + " facturas...", "info")
            
            // Descargar cada factura individualmente (solución temporal)
            selectedFacturas.forEach(facturaId => {
                setTimeout(() => {
                    window.open(`/api/facturas/descargar?id=${facturaId}`, '_blank')
                }, 500) // Pequeño retraso para evitar bloqueo de popups
            })
        }
    }
    
    // Función para manejar el click en "Insertar Factura"
    const handleInsertarFactura = (facturaId) => {
        setSelectedFacturaId(facturaId);
        setSelectedFile(null);
        setUploadProgress(0);
        setShowUploadModal(true);
    };
    
    // Función para manejar la selección de archivos en el modal de inserción
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            setSelectedFile(file);
        } else {
            addNotification("Por favor, selecciona un archivo PDF válido", "error");
            setSelectedFile(null);
        }
    };
    
    // Función para manejar la selección de archivos en el modal de edición
    const handleEditFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            setFormFactura(prev => ({
                ...prev,
                newFile: file,
                hasNewFile: true
            }));
        } else if (file) {
            addNotification("Por favor, selecciona un archivo PDF válido", "error");
            setFormFactura(prev => ({
                ...prev,
                newFile: null,
                hasNewFile: false
            }));
        }
    };
    
    // Función para abrir el modal de edición
    const handleEditFactura = (factura) => {
        // Llenamos el formulario con los datos de la factura
        setFormFactura({
            num_factura: factura.Num_factura || "",
            fecha_emision: formatDateForInput(factura.Fecha_emision) || "",
            estado: factura.Estado || "",
            ruta_pdf: factura.Ruta_pdf || "",
            importe: factura.Importe || "",
            // Campos no editables
            idFactura: factura.idFactura,
            num_orden: factura.Num_orden || "",
            proveedor: factura.Proveedor || "",
            departamento: factura.Departamento || "",
            // Control de archivo nuevo
            newFile: null,
            hasNewFile: false
        });
        
        setEditingFactura(factura);
        setShowEditModal(true);
    };
    
    // Función para manejar cambios en el formulario de edición
    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setFormFactura(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    // Función para guardar cambios de factura
    const handleSaveFacturaChanges = async () => {
        // Validaciones básicas
        if (!formFactura.num_factura || !formFactura.fecha_emision || !formFactura.estado) {
            addNotification("Por favor, completa todos los campos obligatorios", "warning");
            return;
        }
        
        setIsUploading(true);
        
        try {
            // Si hay un nuevo archivo, primero habría que subirlo
            if (formFactura.hasNewFile && formFactura.newFile) {
                // Simulación de progreso para el archivo
                const simulateProgress = () => {
                    let progress = 0;
                    const interval = setInterval(() => {
                        progress += 10;
                        setUploadProgress(progress);
                        if (progress >= 100) {
                            clearInterval(interval);
                        }
                    }, 200);
                    return interval;
                };
                
                const progressInterval = simulateProgress();
                
                // Simulamos la subida del archivo
                await new Promise((resolve) => setTimeout(resolve, 2000));
                clearInterval(progressInterval);
                setUploadProgress(100);
                
                // En una implementación real, aquí se subiría el archivo y se obtendría su ruta
                // Simulamos una nueva ruta
                const fechaActual = new Date();
                const año = fechaActual.getFullYear();
                const nombreArchivo = `fac-${formFactura.proveedor.toLowerCase().substring(0, 3)}-${formFactura.num_factura.toLowerCase()}`;
                const nuevaRuta = `/facturas/${año}/${formFactura.departamento?.toLowerCase().substring(0, 4) || 'dept'}/${nombreArchivo}.pdf`;
                
                // Actualizamos la ruta en el formulario
                setFormFactura(prev => ({
                    ...prev,
                    ruta_pdf: nuevaRuta
                }));
            }
            
            // En una implementación real, aquí se enviarían los datos a la API
            // Simulamos la actualización localmente
            const updatedFacturas = facturas.map(factura => 
                factura.idFactura === formFactura.idFactura 
                    ? {
                        ...factura,
                        Num_factura: formFactura.num_factura,
                        Fecha_emision: new Date(formFactura.fecha_emision),
                        Estado: formFactura.estado,
                        Importe: parseFloat(formFactura.importe),
                        Ruta_pdf: formFactura.hasNewFile ? formFactura.ruta_pdf : factura.Ruta_pdf
                    } 
                    : factura
            );
            
            setFacturas(updatedFacturas);
            
            // Mostrar notificación de éxito
            addNotification("Factura actualizada correctamente", "success");
            
            // Cerrar el modal después de un breve retraso
            setTimeout(() => {
                setShowEditModal(false);
                setEditingFactura(null);
                setUploadProgress(0);
            }, 1000);
            
        } catch (error) {
            console.error("Error actualizando factura:", error);
            addNotification(`Error al actualizar la factura: ${error.message}`, "error");
        } finally {
            setIsUploading(false);
        }
    };
    
    // Función para manejar el envío del formulario de subida
    const handleFileUpload = async () => {
        if (!selectedFile || !selectedFacturaId) {
            addNotification("Por favor, selecciona un archivo PDF", "warning");
            return;
        }
        
        setIsUploading(true);
        
        // Crear FormData para enviar el archivo
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('facturaId', selectedFacturaId);
        
        try {
            // Simulación de progreso (en una implementación real, podrías usar un endpoint que soporte reportar progreso)
            const simulateProgress = () => {
                let progress = 0;
                const interval = setInterval(() => {
                    progress += 10;
                    setUploadProgress(progress);
                    if (progress >= 100) {
                        clearInterval(interval);
                    }
                }, 300);
                return interval;
            };
            
            const progressInterval = simulateProgress();
            
            // En una implementación real, aquí iría la llamada al endpoint de API
            // const response = await fetch('/api/facturas/upload', {
            //     method: 'POST',
            //     body: formData,
            // });
            
            // Simulamos una carga exitosa después de que el progreso llegue al 100%
            await new Promise((resolve) => setTimeout(resolve, 3500));
            clearInterval(progressInterval);
            setUploadProgress(100);
            
            // Actualizamos el estado de la factura localmente
            const facturaIndex = facturas.findIndex(f => f.idFactura === selectedFacturaId);
            if (facturaIndex !== -1) {
                const updatedFacturas = [...facturas];
                // En una implementación real, obtendrías la ruta real del servidor
                const fechaActual = new Date();
                const año = fechaActual.getFullYear();
                const factura = updatedFacturas[facturaIndex];
                // Generamos una ruta siguiendo el patrón observado
                const nombreArchivo = `fac-${factura.Proveedor.toLowerCase().substring(0, 3)}-${factura.Num_factura.toLowerCase()}`;
                const ruta = `/facturas/${año}/${factura.Departamento?.toLowerCase().substring(0, 4) || 'dept'}/${nombreArchivo}.pdf`;
                
                updatedFacturas[facturaIndex] = {
                    ...updatedFacturas[facturaIndex],
                    Ruta_pdf: ruta
                };
                setFacturas(updatedFacturas);
            }
            
            addNotification("Factura subida correctamente", "success");
            
            // Cerrar el modal después de un breve retraso para mostrar el 100%
            setTimeout(() => {
                setShowUploadModal(false);
                setSelectedFacturaId(null);
                setSelectedFile(null);
                setUploadProgress(0);
            }, 1000);
            
        } catch (error) {
            console.error("Error subiendo factura:", error);
            addNotification(`Error al subir la factura: ${error.message}`, "error");
        } finally {
            setIsUploading(false);
        }
    };
    
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

    // Verificar si hay facturas con PDF para descargar
    const hayFacturasDescargables = useMemo(() => {
        return selectedFacturas.some(id => {
            const factura = facturas.find(f => f.idFactura === id);
            return factura && factura.Ruta_pdf;
        });
    }, [selectedFacturas, facturas]);

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
                
                {/* Nuevo filtro de fecha */}
                <div className="relative">
                    <input
                        type="date"
                        placeholder="Filtrar por fecha"
                        value={filterFecha || ''}
                        onChange={(e) => setFilterFecha(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md pl-10"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                </div>
                
                {/* Nuevo filtro de importe */}
                <div className="relative">
                    <select
                        value={filterImporte}
                        onChange={(e) => setFilterImporte(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md appearance-none pl-10"
                    >
                        <option value="">Todos los importes</option>
                        <option value="0-500">Menos de 500€</option>
                        <option value="500-1000">500€ - 1,000€</option>
                        <option value="1000-5000">1,000€ - 5,000€</option>
                        <option value="5000+">Más de 5,000€</option>
                    </select>
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <Euro className="h-5 w-5 text-gray-400" />
                    </div>
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
                <div className="overflow-x-auto max-h-[520px]">
                    <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr className="border-b border-gray-200">
                                <th className="py-3 px-3 w-12">
                                    {filteredFacturas.length > 0 && (
                                        <div className="flex justify-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedFacturas.length === filteredFacturas.length && filteredFacturas.length > 0}
                                                onChange={toggleSelectAll}
                                                className="h-4 w-4 text-red-600 border-gray-300 rounded"
                                            />
                                        </div>
                                    )}
                                </th>
                                <th className="py-3 px-4 text-left font-medium text-gray-600">Nº Factura</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-600">Proveedor</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-600">Fecha emisión</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-600">Importe</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-600">Num Orden</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-600">Estado</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-600">Departamento</th>
                                <th className="py-3 px-4 text-center font-medium text-gray-600"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFacturas.length > 0 ? (
                                filteredFacturas.map((factura) => (
                                    <tr 
                                        key={factura.idFactura} 
                                        className={`border-t border-gray-200 cursor-pointer hover:bg-gray-50 ${
                                            selectedFacturas.includes(factura.idFactura) ? "bg-red-50" : ""
                                        }`}
                                        onClick={() => toggleSelectFactura(factura.idFactura)}
                                    >
                                        <td className="py-3 px-3 w-12" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedFacturas.includes(factura.idFactura)}
                                                    onChange={() => toggleSelectFactura(factura.idFactura)}
                                                    className="h-4 w-4 text-red-600 border-gray-300 rounded"
                                                />
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">{factura.Num_factura}</td>
                                        <td className="py-3 px-4">{factura.Proveedor}</td>
                                        <td className="py-3 px-4">{formatDate(factura.Fecha_emision)}</td>
                                        <td className="py-3 px-4">{factura.Importe ? `${factura.Importe.toLocaleString()}€` : '-'}</td>
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
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleUpdateEstado(factura.idFactura, estado);
                                                                }}
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
                                            <div className="flex justify-center gap-2 items-center">
                                                {/* Botón de editar */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditFactura(factura);
                                                    }}
                                                    className="text-gray-500 hover:text-red-600"
                                                    title="Editar factura"
                                                >
                                                    <Pencil className="w-5 h-5" />
                                                </button>
                                                
                                                {/* Botón de insertar factura cuando no hay PDF */}
                                                {!factura.Ruta_pdf && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleInsertarFactura(factura.idFactura);
                                                        }}
                                                        className="bg-green-600 text-white text-sm px-3 py-1 rounded hover:bg-green-700"
                                                    >
                                                        Insertar Factura
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                               <tr>
                                   <td colSpan="9" className="py-6 text-center text-gray-500">
                                       {userRole === "Jefe de Departamento" 
                                           ? `No se encontraron facturas para el departamento de ${departamento}` 
                                           : searchTerm || filterFecha || filterImporte || filterProveedor || filterEstado
                                               ? "No se encontraron facturas con los criterios de búsqueda actuales"
                                               : "No se encontraron facturas."}
                                   </td>
                               </tr>
                           )}
                       </tbody>
                   </table>
               </div>
           </div>
           
           {/* Botones de acción */}
           <div className="flex justify-between mb-6">
               {/* Botón para descargar facturas seleccionadas */}
               <button
                    onClick={handleDescargarSeleccionadas}
                    disabled={!hayFacturasDescargables}
                    className={`flex items-center gap-2 bg-red-600 opacity-80 text-white px-6 py-2 rounded-md ${
                        hayFacturasDescargables 
                            ? "hover:bg-red-700 cursor-pointer" 
                            : "opacity-50 cursor-not-allowed"
                    }`}
                >
                    <Download className="w-4 h-4" />
                    <span>Descargar {selectedFacturas.length > 0 ? `(${selectedFacturas.length})` : ""}</span>
                </button>
           </div>
           
           {/* Modal para subir factura */}
           {showUploadModal && (
               <div
                   className="fixed inset-0 flex items-center justify-center z-50"
                   style={{
                       backgroundColor: "rgba(0, 0, 0, 0.3)",
                       backdropFilter: "blur(2px)"
                   }}
               >
                   <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
                       <div className="flex justify-between items-center mb-4">
                           <h2 className="text-xl font-bold">Subir Factura PDF</h2>
                           <button
                               onClick={() => !isUploading && setShowUploadModal(false)}
                               className="text-gray-500 hover:text-red-600"
                               disabled={isUploading}
                           >
                               <X className="w-6 h-6" />
                           </button>
                       </div>
                       
                       <div className="mb-6">
                           <div className="mb-4">
                               <label className="block text-gray-700 mb-2">Selecciona un archivo PDF:</label>
                               <div className="flex items-center">
                                   <input
                                       type="file"
                                       accept=".pdf"
                                       onChange={handleFileChange}
                                       className="hidden"
                                       ref={fileInputRef}
                                       disabled={isUploading}
                                   />
                                   <button
                                       onClick={() => fileInputRef.current?.click()}
                                       className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md flex items-center gap-2"
                                       disabled={isUploading}
                                   >
                                       <Upload className="w-4 h-4" />
                                       Seleccionar PDF
                                   </button>
                                   <span className="ml-3 text-sm text-gray-500">
                                       {selectedFile ? selectedFile.name : "Ningún archivo seleccionado"}
                                   </span>
                               </div>
                           </div>
                           
                           {isUploading && (
                               <div className="mt-4">
                                   <div className="w-full bg-gray-200 rounded-full h-2.5">
                                       <div 
                                           className="bg-green-600 h-2.5 rounded-full" 
                                           style={{ width: `${uploadProgress}%` }}
                                       ></div>
                                   </div>
                                   <p className="text-sm text-gray-500 mt-1 text-center">
                                       {uploadProgress < 100 ? 'Subiendo...' : 'Completado!'}
                                   </p>
                               </div>
                           )}
                       </div>
                       
                       <div className="flex justify-end gap-3">
                           <button
                               onClick={() => !isUploading && setShowUploadModal(false)}
                               className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                               disabled={isUploading}
                           >
                               Cancelar
                           </button>
                           <button
                               onClick={handleFileUpload}
                               disabled={!selectedFile || isUploading}
                               className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                           >
                               {isUploading ? "Subiendo..." : "Subir Factura"}
                           </button>
                       </div>
                   </div>
               </div>
           )}
           
           {/* Modal para editar factura */}
           {showEditModal && (
               <div
                   className="fixed inset-0 flex items-center justify-center z-50"
                   style={{
                       backgroundColor: "rgba(0, 0, 0, 0.3)",
                       backdropFilter: "blur(2px)"
                   }}
               >
                   <div className="bg-white rounded-lg p-6 max-w-2xl w-full shadow-xl">
                       <div className="flex justify-between items-center mb-4">
                           <h2 className="text-xl font-bold">Editar Factura</h2>
                           <button
                               onClick={() => !isUploading && setShowEditModal(false)}
                               className="text-gray-500 hover:text-red-600"
                               disabled={isUploading}
                           >
                               <X className="w-6 h-6" />
                           </button>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                           {/* Campos editables */}
                           <div>
                               <label className="block text-gray-700 mb-1">Número de Factura</label>
                               <input
                                   type="text"
                                   name="num_factura"
                                   value={formFactura.num_factura}
                                   onChange={handleEditFormChange}
                                   className="border border-gray-300 rounded px-3 py-2 w-full"
                                   required
                               />
                           </div>
                           
                           <div>
                               <label className="block text-gray-700 mb-1">Fecha de Emisión</label>
                               <input
                                   type="date"
                                   name="fecha_emision"
                                   value={formFactura.fecha_emision}
                                   onChange={handleEditFormChange}
                                   className="border border-gray-300 rounded px-3 py-2 w-full"
                                   required
                               />
                           </div>
                           
                           <div>
                               <label className="block text-gray-700 mb-1">Importe (€)</label>
                               <input
                                   type="number"
                                   step="0.01"
                                   name="importe"
                                   value={formFactura.importe}
                                   onChange={handleEditFormChange}
                                   className="border border-gray-300 rounded px-3 py-2 w-full"
                                   placeholder="0.00"
                               />
                           </div>
                           
                           <div>
                               <label className="block text-gray-700 mb-1">Estado</label>
                               <div className="relative">
                                   <select
                                       name="estado"
                                       value={formFactura.estado}
                                       onChange={handleEditFormChange}
                                       className="appearance-none border border-gray-300 rounded px-3 py-2 w-full pr-8"
                                       required
                                   >
                                       <option value="">Seleccionar estado</option>
                                       {estadoOptions.map((estado) => (
                                           <option key={estado} value={estado}>
                                               {estado}
                                           </option>
                                       ))}
                                   </select>
                                   <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                       <ChevronDown className="w-4 h-4 text-gray-500" />
                                   </div>
                               </div>
                           </div>
                           
                           {/* Campos no editables (informativos) */}
                           <div>
                               <label className="block text-gray-700 mb-1">Número de Orden</label>
                               <input
                                   type="text"
                                   value={formFactura.num_orden}
                                   className="border border-gray-300 rounded px-3 py-2 w-full bg-gray-100"
                                   disabled
                               />
                           </div>
                           
                           <div>
                               <label className="block text-gray-700 mb-1">Proveedor</label>
                               <input
                                   type="text"
                                   value={formFactura.proveedor}
                                   className="border border-gray-300 rounded px-3 py-2 w-full bg-gray-100"
                                   disabled
                               />
                           </div>
                           
                           <div>
                               <label className="block text-gray-700 mb-1">Departamento</label>
                               <input
                                   type="text"
                                   value={formFactura.departamento}
                                   className="border border-gray-300 rounded px-3 py-2 w-full bg-gray-100"
                                   disabled
                               />
                           </div>
                           
                           {/* Sección para cambiar el PDF */}
                           <div className="md:col-span-2 mt-4">
                               <div className="border-t border-gray-200 pt-4">
                                   <h3 className="font-medium mb-2">Archivo de Factura</h3>
                                   
                                   {formFactura.ruta_pdf ? (
                                       <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                                           <div className="flex items-center">
                                               <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                                                   <span className="text-red-600 text-xs">PDF</span>
                                               </div>
                                               <div>
                                                   <p className="text-sm font-medium">Factura actual</p>
                                                   <p className="text-xs text-gray-500 truncate max-w-xs">{formFactura.ruta_pdf}</p>
                                               </div>
                                           </div>
                                           
                                           <div className="flex gap-2">
                                               <Link 
                                                   href={`/api/facturas/descargar?id=${formFactura.idFactura}`}
                                                   className="text-xs text-blue-600 hover:underline"
                                                   target="_blank"
                                               >
                                                   Ver
                                               </Link>
                                           </div>
                                       </div>
                                   ) : (
                                       <p className="text-sm text-gray-500">No hay archivo PDF asociado a esta factura.</p>
                                   )}
                                   
                                   <div className="mt-3">
                                       <div className="flex items-center">
                                           <input
                                               type="file"
                                               accept=".pdf"
                                               onChange={handleEditFileChange}
                                               className="hidden"
                                               ref={editFileInputRef}
                                               disabled={isUploading}
                                           />
                                           <button
                                               onClick={() => editFileInputRef.current?.click()}
                                               className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md flex items-center gap-2"
                                               disabled={isUploading}
                                           >
                                               <Upload className="w-4 h-4" />
                                               {formFactura.ruta_pdf ? "Cambiar PDF" : "Subir PDF"}
                                           </button>
                                           <span className="ml-3 text-sm text-gray-500">
                                               {formFactura.hasNewFile && formFactura.newFile
                                                   ? formFactura.newFile.name
                                                   : "Ningún archivo nuevo seleccionado"}
                                           </span>
                                       </div>
                                   </div>
                                   
                                   {isUploading && formFactura.hasNewFile && (
                                       <div className="mt-4">
                                           <div className="w-full bg-gray-200 rounded-full h-2.5">
                                               <div 
                                                   className="bg-green-600 h-2.5 rounded-full" 
                                                   style={{ width: `${uploadProgress}%` }}
                                               ></div>
                                           </div>
                                           <p className="text-sm text-gray-500 mt-1 text-center">
                                               {uploadProgress < 100 ? 'Subiendo...' : 'Completado!'}
                                           </p>
                                       </div>
                                   )}
                               </div>
                           </div>
                       </div>
                       
                       <div className="flex justify-end gap-3">
                           <button
                               onClick={() => !isUploading && setShowEditModal(false)}
                               className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                               disabled={isUploading}
                           >
                               Cancelar
                           </button>
                           <button
                               onClick={handleSaveFacturaChanges}
                               disabled={isUploading}
                               className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                           >
                               {isUploading ? "Guardando..." : "Guardar Cambios"}
                           </button>
                       </div>
                   </div>
               </div>
           )}
       </div>
   )
}