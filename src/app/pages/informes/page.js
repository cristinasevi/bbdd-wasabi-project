"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { ChevronDown, Calendar, Download, X, FileText } from "lucide-react"
import useUserDepartamento from "@/app/hooks/useUserDepartamento"
import useNotifications from "@/app/hooks/useNotifications"
import Image from 'next/image'
import Link from "next/link"

export default function Informes() {
    const { departamento, isLoading: isDepartamentoLoading } = useUserDepartamento()
    const { addNotification, notificationComponents } = useNotifications()
    const [userRole, setUserRole] = useState(null)
    const [loading, setLoading] = useState(false)
    const [ordenes, setOrdenes] = useState([])
    const [isLoadingOrdenes, setIsLoadingOrdenes] = useState(true)
    
    // Referencias para las bibliotecas de PDF
    const jsPDFRef = useRef(null)
    const autoTableRef = useRef(null)
    
    // Estado para el formulario
    const [mes, setMes] = useState("")
    const [ano, setAno] = useState("")
    
    // Estado para el modal de informe
    const [showInformeModal, setShowInformeModal] = useState(false)
    const [informeData, setInformeData] = useState(null)
    const [generatingInforme, setGeneratingInforme] = useState(false)
    const [generatingPDF, setGeneratingPDF] = useState(false)
    const [pdfLibsLoaded, setPdfLibsLoaded] = useState(false)
    
    // Variable para definir el color primario (rojo)
    const primaryColor = { r: 220, g: 38, b: 38 } // Tailwind red-600
    
    const meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    // Cargar bibliotecas PDF cuando se necesiten
    useEffect(() => {
        if (showInformeModal && !pdfLibsLoaded) {
            const loadPdfLibs = async () => {
                try {
                    // Cargar jsPDF
                    const jsPDFModule = await import('jspdf');
                    jsPDFRef.current = jsPDFModule.default;
                    
                    // Cargar autoTable
                    const autoTableModule = await import('jspdf-autotable');
                    autoTableRef.current = autoTableModule.default;
                    
                    setPdfLibsLoaded(true);
                } catch (error) {
                    console.error("Error cargando bibliotecas PDF:", error);
                    addNotification("Error cargando herramientas para generar PDF", "error");
                }
            };
            
            loadPdfLibs();
        }
    }, [showInformeModal, pdfLibsLoaded, addNotification]);
    
    // Obtener órdenes de compra para determinar meses y años disponibles
    useEffect(() => {
        async function fetchOrdenes() {
            if (!departamento) return;
            
            setIsLoadingOrdenes(true);
            try {
                // Primero intentar obtener las órdenes por departamento
                let response = await fetch(`/api/getOrdenByDepartamento?id=${encodeURIComponent(departamento)}`);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log("Órdenes cargadas:", data.length);
                    
                    // Verificar si hay datos en las órdenes obtenidas
                    if (data && data.length > 0) {
                        setOrdenes(data);
                    } else {
                        console.warn("No se encontraron órdenes para el departamento:", departamento);
                        
                        // Como alternativa, intentar obtener todas las órdenes
                        response = await fetch('/api/getOrden');
                        if (response.ok) {
                            const allOrdenes = await response.json();
                            console.log("Todas las órdenes cargadas:", allOrdenes.length);
                            
                            // Filtrar solo las órdenes del departamento
                            const filteredOrdenes = allOrdenes.filter(
                                orden => orden.Departamento === departamento
                            );
                            
                            console.log("Órdenes filtradas para departamento:", filteredOrdenes.length);
                            setOrdenes(filteredOrdenes);
                        }
                    }
                } else {
                    // Si falla, intentar obtener todas las órdenes y filtrar por departamento
                    console.warn("Error al obtener órdenes específicas del departamento:", await response.text());
                    
                    response = await fetch('/api/getOrden');
                    if (response.ok) {
                        const allOrdenes = await response.json();
                        
                        // Filtrar solo las órdenes del departamento
                        const filteredOrdenes = allOrdenes.filter(
                            orden => orden.Departamento === departamento
                        );
                        
                        console.log("Órdenes filtradas para departamento:", filteredOrdenes.length);
                        setOrdenes(filteredOrdenes);
                    }
                }
            } catch (error) {
                console.error("Error obteniendo órdenes de compra:", error);
                addNotification("Error al cargar órdenes de compra", "error");
            } finally {
                setIsLoadingOrdenes(false);
            }
        }
        
        fetchOrdenes();
    }, [departamento, addNotification]);

    
    // Obtener información del usuario
    useEffect(() => {
        async function fetchUserInfo() {
            try {
                const response = await fetch('/api/getSessionUser')
                if (response.ok) {
                    const data = await response.json()
                    setUserRole(data.usuario?.rol || '')
                }
            } catch (error) {
                console.error("Error obteniendo información del usuario:", error)
            }
        }
        
        fetchUserInfo()
    }, [])
    
    // Función para extraer mes y año de una fecha
    const extraerFecha = (fechaString) => {
        if (!fechaString) return { mes: null, ano: null };
        
        try {
            // Intentar diferentes formatos de fecha
            let fecha;
            
            // Si es un objeto Date
            if (fechaString instanceof Date) {
                fecha = fechaString;
            } 
            // Si es un string ISO
            else if (typeof fechaString === 'string') {
                // Verificar si el formato es yyyy-mm-dd
                const isoMatch = fechaString.match(/(\d{4})-(\d{2})-(\d{2})/);
                if (isoMatch) {
                    fecha = new Date(fechaString);
                } 
                // Verificar si el formato es dd/mm/yyyy
                else if (fechaString.includes('/')) {
                    const parts = fechaString.split('/');
                    if (parts.length === 3) {
                        // Si el primer número parece un día (1-31)
                        if (parseInt(parts[0]) <= 31) {
                            fecha = new Date(parts[2], parts[1] - 1, parts[0]);
                        } else {
                            fecha = new Date(parts[0], parts[1] - 1, parts[2]);
                        }
                    }
                } else {
                    // Intentar el análisis estándar
                    fecha = new Date(fechaString);
                }
            }
            
            // Verificar si la fecha es válida
            if (isNaN(fecha.getTime())) {
                console.warn("Fecha inválida:", fechaString);
                return { mes: null, ano: null };
            }
            
            return {
                mes: meses[fecha.getMonth()],
                ano: fecha.getFullYear().toString()
            };
        } catch (e) {
            console.error("Error al procesar fecha:", e, fechaString);
            return { mes: null, ano: null };
        }
    };
    
    // Obtener meses y años disponibles basados en las órdenes existentes
    const { mesesDisponibles, anosDisponibles, combinacionesDisponibles } = useMemo(() => {
        const mesSet = new Set();
        const anoSet = new Set();
        const combinaciones = new Map(); // Mapa para almacenar combinaciones mes-año
        
        if (ordenes && ordenes.length > 0) {
            ordenes.forEach(orden => {
                if (orden.Fecha) {
                    const { mes, ano } = extraerFecha(orden.Fecha);
                    
                    if (mes && ano) {
                        mesSet.add(mes);
                        anoSet.add(ano);
                        
                        // Almacenar combinaciones válidas de mes-año
                        if (!combinaciones.has(mes)) {
                            combinaciones.set(mes, new Set());
                        }
                        combinaciones.get(mes).add(ano);
                    }
                }
            });
        }
        
        // Convertir a arrays y ordenar
        const mesesOrdenados = Array.from(mesSet).sort((a, b) => 
            meses.indexOf(a) - meses.indexOf(b)
        );
        
        const anosOrdenados = Array.from(anoSet).sort();
        
        return { 
            mesesDisponibles: mesesOrdenados, 
            anosDisponibles: anosOrdenados,
            combinacionesDisponibles: combinaciones
        };
    }, [ordenes, meses]);
    
    // Agregar esto después del final del useMemo de combinacionesDisponibles
    const hayDatosDisponibles = useMemo(() => {
        return mesesDisponibles.length > 0 && anosDisponibles.length > 0;
    }, [mesesDisponibles, anosDisponibles]);
    // Filtrar años disponibles según el mes seleccionado
    const anosFiltrados = useMemo(() => {
        if (!mes) return anosDisponibles;
        
        // Si hay un mes seleccionado, mostrar solo los años que tienen datos para ese mes
        if (combinacionesDisponibles.has(mes)) {
            return Array.from(combinacionesDisponibles.get(mes)).sort();
        }
        
        return [];
    }, [mes, anosDisponibles, combinacionesDisponibles]);
    
    // Filtrar meses disponibles según el año seleccionado
    const mesesFiltrados = useMemo(() => {
        if (!ano) return mesesDisponibles;
        
        // Si hay un año seleccionado, mostrar solo los meses que tienen datos para ese año
        const mesesDelAno = [];
        combinacionesDisponibles.forEach((anos, mesKey) => {
            if (anos.has(ano)) {
                mesesDelAno.push(mesKey);
            }
        });
        
        return mesesDelAno.sort((a, b) => meses.indexOf(a) - meses.indexOf(b));
    }, [ano, mesesDisponibles, combinacionesDisponibles, meses]);
    
    // Función para generar el informe
    const handleGenerarInforme = async () => {
        // Validar que se haya seleccionado mes y año
        if (!mes || !ano) {
            addNotification("Por favor, selecciona mes y año para generar el informe", "warning")
            return
        }
        
        // Verificar si hay datos para la combinación de mes y año seleccionada
        let tieneOrdenes = false;
        
        if (combinacionesDisponibles.has(mes)) {
            tieneOrdenes = combinacionesDisponibles.get(mes).has(ano);
        }
        
        if (!tieneOrdenes) {
            addNotification("No hay datos disponibles para el periodo seleccionado", "warning");
            return;
        }
        
        setGeneratingInforme(true);
        
        try {
            // Filtrar órdenes para el mes y año seleccionados
            const mesIndex = meses.indexOf(mes);
            const ordenesDelPeriodo = ordenes.filter(orden => {
                if (!orden.Fecha) return false;
                
                const fecha = new Date(orden.Fecha);
                return fecha.getMonth() === mesIndex && fecha.getFullYear().toString() === ano;
            });
            
            // Calcular totales
            const totalGastado = ordenesDelPeriodo.reduce((total, orden) => total + parseFloat(orden.Importe || 0), 0);
            
            // Obtener datos de presupuesto e inversión mediante consultas adicionales
            // Estos valores serían idealmente obtenidos del backend, pero para mantener la simulación:
            const presupuestoTotal = Math.floor(Math.random() * 30000) + 20000;
            const presupuestoGastado = Math.min(totalGastado, presupuestoTotal);
            const inversionTotal = Math.floor(Math.random() * 20000) + 10000;
            const inversionGastada = Math.floor(Math.random() * 15000);
            
            // Generar datos de informe basados en órdenes reales
            const simulatedData = {
                titulo: `Informe de ${mes} ${ano}`,
                departamento: departamento || "Todos",
                fechaGeneracion: new Date().toLocaleDateString(),
                presupuestoTotal: presupuestoTotal,
                presupuestoGastado: presupuestoGastado,
                inversionTotal: inversionTotal,
                inversionGastada: inversionGastada,
                ordenes: ordenesDelPeriodo.map((orden, i) => ({
                    id: orden.idOrden || i + 1,
                    numero: orden.Num_orden || `ORD/${String(i + 1).padStart(3, '0')}/${ano.toString().substring(2)}/1`,
                    importe: parseFloat(orden.Importe) || 0,
                    fecha: orden.Fecha ? new Date(orden.Fecha).toLocaleDateString() : `${Math.floor(Math.random() * 28) + 1}/${mesIndex + 1}/${ano}`,
                    descripcion: orden.Descripcion || `Compra de material ${i % 2 === 0 ? 'inventariable' : 'fungible'}`
                }))
            };
            
            setInformeData(simulatedData);
            setShowInformeModal(true);
            
        } catch (error) {
            console.error("Error generando informe:", error);
            addNotification("Error al generar el informe. Inténtalo de nuevo.", "error");
        } finally {
            setGeneratingInforme(false);
        }
    };
    
    // Función para convertir una imagen en base64
    const getBase64Image = async (imgUrl) => {
        try {
            const response = await fetch(imgUrl);
            const blob = await response.blob();
            
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error("Error convirtiendo imagen a base64:", error);
            return null;
        }
    };
    
    // Función para descargar el informe como PDF
    const handleDescargarInforme = async () => {
        if (!informeData) return;
        
        // Verificar si las bibliotecas están cargadas
        if (!pdfLibsLoaded) {
            addNotification("Cargando herramientas de PDF, por favor espera...", "info");
            return;
        }
        
        setGeneratingPDF(true);
        
        try {
            // Crear una instancia de jsPDF
            const doc = new jsPDFRef.current({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            // Configuración de fuentes
            doc.setFont("helvetica");
            
            // Obtener logo como base64
            let logoBase64 = null;
            try {
                // Intentar cargar el logo
                logoBase64 = await getBase64Image('/images/logo-salesianos.png');
            } catch (error) {
                console.warn("No se pudo cargar el logo:", error);
            }
            
            // Añadir logo de Salesianos si está disponible
            if (logoBase64) {
                doc.addImage(logoBase64, 'PNG', 20, 10, 25, 25);
                // Desplazar el título para dar espacio al logo
                doc.setFontSize(20);
                doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
                doc.text(informeData.titulo, 50, 25);
            } else {
                // Si no hay logo, usar solo el título
                doc.setFontSize(20);
                doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
                doc.text(informeData.titulo, 20, 20);
            }
            
            // Línea divisoria bajo el encabezado
            doc.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b);
            doc.setLineWidth(0.5);
            doc.line(20, logoBase64 ? 40 : 25, 190, logoBase64 ? 40 : 25);
            
            // Añadir info del departamento y fecha
            const infoStartY = logoBase64 ? 50 : 35;
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(`Departamento: ${informeData.departamento}`, 20, infoStartY);
            doc.text(`Fecha generación: ${informeData.fechaGeneracion}`, 20, infoStartY + 7);
            
            // Resumen financiero - Presupuesto
            const presupuestoStartY = infoStartY + 20;
            doc.setFontSize(14);
            doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
            doc.text('Presupuesto', 20, presupuestoStartY);
            
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text('Total asignado:', 25, presupuestoStartY + 8);
            doc.text(`${informeData.presupuestoTotal.toLocaleString()} €`, 100, presupuestoStartY + 8);
            doc.text('Gastado:', 25, presupuestoStartY + 15);
            doc.text(`${informeData.presupuestoGastado.toLocaleString()} €`, 100, presupuestoStartY + 15);
            doc.text('Restante:', 25, presupuestoStartY + 22);
            doc.text(`${(informeData.presupuestoTotal - informeData.presupuestoGastado).toLocaleString()} €`, 100, presupuestoStartY + 22);
            
            // Resumen financiero - Inversión
            const inversionStartY = presupuestoStartY + 35;
            doc.setFontSize(14);
            doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
            doc.text('Inversión', 20, inversionStartY);
            
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text('Total asignado:', 25, inversionStartY + 8);
            doc.text(`${informeData.inversionTotal.toLocaleString()} €`, 100, inversionStartY + 8);
            doc.text('Gastado:', 25, inversionStartY + 15);
            doc.text(`${informeData.inversionGastada.toLocaleString()} €`, 100, inversionStartY + 15);
            doc.text('Restante:', 25, inversionStartY + 22);
            doc.text(`${(informeData.inversionTotal - informeData.inversionGastada).toLocaleString()} €`, 100, inversionStartY + 22);
            
            // Tabla de órdenes de compra
            const ordenesStartY = inversionStartY + 35;
            doc.setFontSize(14);
            doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
            doc.text('Órdenes de Compra', 20, ordenesStartY);
            
            // Preparar datos para la tabla de órdenes
            const tableRows = informeData.ordenes.map(orden => [
                orden.numero,
                orden.fecha,
                orden.descripcion,
                `${orden.importe.toLocaleString()} €`
            ]);
            
            // Añadir fila de total
            const totalImporte = informeData.ordenes.reduce((sum, orden) => sum + orden.importe, 0);
            tableRows.push([
                '',
                '',
                'TOTAL',
                `${totalImporte.toLocaleString()} €`
            ]);
            
            // Usar autoTable como función independiente en lugar de método
            autoTableRef.current(doc, {
                startY: ordenesStartY + 5,
                head: [['Nº Orden', 'Fecha', 'Descripción', 'Importe']],
                body: tableRows,
                theme: 'grid',
                styles: { fontSize: 9 },
                headStyles: { 
                    fillColor: [primaryColor.r, primaryColor.g, primaryColor.b], 
                    textColor: [255, 255, 255] 
                },
                footStyles: { 
                    fillColor: [240, 240, 240], 
                    fontStyle: 'bold' 
                },
                margin: { top: 20 }
            });
            
            // Pie de página
            const pageCount = doc.internal.getNumberOfPages();
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
                doc.text('Salesianos Zaragoza - Sistema WASABI', doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 5, { align: 'center' });
            }
            
            // Guardar el PDF y descargarlo
            doc.save(`Informe_${departamento || 'General'}_${mes}_${ano}.pdf`);
            
            addNotification("Informe descargado correctamente", "success");
            
        } catch (error) {
            console.error("Error generando PDF:", error);
            addNotification("Error al generar el PDF. Inténtalo de nuevo.", "error");
        } finally {
            setGeneratingPDF(false);
        }
    };
    
    if (isDepartamentoLoading) {
        return <div className="p-6">Cargando...</div>
    }

    return (
        <div className="p-6">
            {/* Mostrar notificaciones */}
            {notificationComponents}
            
            {/* Encabezado */}
            <div className="mb-16">
                <h1 className="text-3xl font-bold">Informes</h1>
                <h2 className="text-xl text-gray-400">Departamento {departamento}</h2>
            </div>

            <div className="flex items-center justify-center my-8">
                <div className="w-full max-w-md p-10 bg-gray-50 rounded-lg shadow-lg">
                    <div className="flex items-center gap-3 mb-8 justify-center">
                        <div className="relative w-8 h-8">
                            <Image 
                                src="/images/logo-salesianos.png" 
                                alt="Logo Salesianos" 
                                fill 
                                className="object-contain"
                            />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-600">Período Informe</h1>
                    </div>
            
                    <form className="space-y-6">
                        {/* Mostrar un mensaje si no hay datos disponibles */}
                        {!isLoadingOrdenes && !hayDatosDisponibles ? (
                            <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                                <p className="text-yellow-700 mb-2 font-semibold">No hay datos de órdenes disponibles</p>
                                <p className="text-sm text-yellow-600 mb-4">
                                    No se encontraron órdenes de compra para el departamento seleccionado. 
                                    Para generar informes, primero debe haber órdenes registradas.
                                </p>
                                
                                <Link href="/pages/ordenes-compra">
                                    <button
                                        type="button"
                                        className="w-full bg-yellow-600 text-white py-2 rounded-md hover:bg-yellow-700 transition-colors"
                                    >
                                        Ir a Órdenes de Compra
                                    </button>
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <label htmlFor="mes" className="block text-gray-700 mb-2">
                                        Mes
                                    </label>
                                    <select
                                        id="mes"
                                        value={mes}
                                        onChange={(e) => {
                                            setMes(e.target.value);
                                            // Si el año seleccionado no es válido para este mes, resetearlo
                                            if (e.target.value && ano && 
                                                combinacionesDisponibles.has(e.target.value) && 
                                                !combinacionesDisponibles.get(e.target.value).has(ano)) {
                                                setAno('');
                                            }
                                        }}
                                        className={`w-full bg-white px-4 py-3 border border-gray-300 text-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${isLoadingOrdenes ? 'opacity-50' : ''}`}
                                        disabled={isLoadingOrdenes || mesesFiltrados.length === 0}
                                    >
                                        <option value="">Selecciona un mes</option>
                                        {mesesFiltrados.map((mesOpcion) => (
                                            <option key={mesOpcion} value={mesOpcion}>
                                                {mesOpcion}
                                            </option>
                                        ))}
                                    </select>
                                    {isLoadingOrdenes && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Cargando datos disponibles...
                                        </p>
                                    )}
                                    {!isLoadingOrdenes && mesesFiltrados.length === 0 && (
                                        <p className="text-xs text-red-500 mt-1">
                                            No hay meses con datos disponibles
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="año" className="block text-gray-700 mb-2">
                                        Año
                                    </label>
                                    <select
                                        id="año"
                                        value={ano}
                                        onChange={(e) => {
                                            setAno(e.target.value);
                                            // Si el mes seleccionado no es válido para este año, resetearlo
                                            if (e.target.value && mes) {
                                                let esValido = false;
                                                
                                                combinacionesDisponibles.forEach((anos, mesKey) => {
                                                    if (mesKey === mes && anos.has(e.target.value)) {
                                                        esValido = true;
                                                    }
                                                });
                                                
                                                if (!esValido) {
                                                    setMes('');
                                                }
                                            }
                                        }}
                                        className={`w-full bg-white px-4 py-3 border border-gray-300 text-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${isLoadingOrdenes ? 'opacity-50' : ''}`}
                                        disabled={isLoadingOrdenes || anosFiltrados.length === 0}
                                    >
                                        <option value="">Selecciona un año</option>
                                        {anosFiltrados.map((anoOpcion) => (
                                            <option key={anoOpcion} value={anoOpcion}>
                                                {anoOpcion}
                                            </option>
                                        ))}
                                    </select>
                                    {!isLoadingOrdenes && anosFiltrados.length === 0 && (
                                        <p className="text-xs text-red-500 mt-1">
                                            No hay años con datos disponibles
                                        </p>
                                    )}
                                </div>
                                
                                {/* Mensaje informativo */}
                                {!isLoadingOrdenes && mesesDisponibles.length > 0 && (
                                    <div className="text-xs text-gray-600 italic">
                                        Solo se muestran periodos con datos disponibles.
                                        Hay {mesesDisponibles.length} meses y {anosDisponibles.length} años disponibles.
                                    </div>
                                )}
                        
                                <button
                                    type="button"
                                    onClick={handleGenerarInforme}
                                    disabled={generatingInforme || !mes || !ano || isLoadingOrdenes}
                                    className="w-full bg-red-600 text-white py-3 rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {generatingInforme ? (
                                        <div className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Generando informe...
                                        </div>
                                    ) : (
                                        "Generar informe"
                                    )}
                                </button>
                            </>
                        )}
                    </form>
                </div>
            </div>
            
            {/* Modal de visualización de informe */}
            {showInformeModal && informeData && (
                <div
                    className="fixed inset-0 flex items-center justify-center z-50"
                    style={{
                        backgroundColor: "rgba(0, 0, 0, 0.3)",
                        backdropFilter: "blur(2px)"
                    }}
                >
                    <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                                <div className="relative w-10 h-10">
                                    <Image 
                                        src="/images/logo-salesianos.png" 
                                        alt="Logo Salesianos" 
                                        fill 
                                        className="object-contain"
                                    />
                                </div>
                                <h2 className="text-xl font-bold">{informeData.titulo}</h2>
                            </div>
                            <button
                                onClick={() => setShowInformeModal(false)}
                                className="text-gray-500 hover:text-red-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        {/* Línea divisoria */}
                        <div className="border-b border-red-600 mb-4"></div>
                        
                        {/* Contenido del informe */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <p className="text-gray-600">Departamento: <span className="font-semibold">{informeData.departamento}</span></p>
                                    <p className="text-gray-600">Fecha generación: <span className="font-semibold">{informeData.fechaGeneracion}</span></p>
                                </div>
                                
                                <div className="flex justify-end">
                                    <button
                                        onClick={handleDescargarInforme}
                                        disabled={generatingPDF || !pdfLibsLoaded}
                                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {generatingPDF ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Generando...
                                            </>
                                        ) : !pdfLibsLoaded ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Cargando herramientas...
                                            </>
                                        ) : (
                                            <>
                                                <Download className="w-4 h-4" />
                                                Descargar PDF
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                            
                            {/* Resumen financiero */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h3 className="text-lg font-semibold mb-2 text-red-600">Presupuesto</h3>
                                    <div className="flex justify-between">
                                        <p className="text-gray-600">Total asignado:</p>
                                        <p className="font-bold">{informeData.presupuestoTotal.toLocaleString()} €</p>
                                    </div>
                                    <div className="flex justify-between">
                                        <p className="text-gray-600">Gastado:</p>
                                        <p className="font-bold">{informeData.presupuestoGastado.toLocaleString()} €</p>
                                    </div>
                                    <div className="flex justify-between mt-2 pt-2 border-t border-gray-200">
                                        <p className="text-gray-600">Restante:</p>
                                        <p className="font-bold text-green-600">
                                            {(informeData.presupuestoTotal - informeData.presupuestoGastado).toLocaleString()} €
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h3 className="text-lg font-semibold mb-2 text-red-600">Inversión</h3>
                                    <div className="flex justify-between">
                                        <p className="text-gray-600">Total asignado:</p>
                                        <p className="font-bold">{informeData.inversionTotal.toLocaleString()} €</p>
                                    </div>
                                    <div className="flex justify-between">
                                        <p className="text-gray-600">Gastado:</p>
                                        <p className="font-bold">{informeData.inversionGastada.toLocaleString()} €</p>
                                    </div>
                                    <div className="flex justify-between mt-2 pt-2 border-t border-gray-200">
                                        <p className="text-gray-600">Restante:</p>
                                        <p className="font-bold text-green-600">
                                            {(informeData.inversionTotal - informeData.inversionGastada).toLocaleString()} €
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Tabla de órdenes de compra */}
                            <div className="mt-6">
                                <h3 className="text-lg font-semibold mb-3 text-red-600">Órdenes de Compra</h3>
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-red-600 text-white">
                                            <tr className="border-b border-gray-200">
                                                <th className="py-3 px-4 text-left font-medium">Nº Orden</th>
                                                <th className="py-3 px-4 text-left font-medium">Fecha</th>
                                                <th className="py-3 px-4 text-left font-medium">Descripción</th>
                                                <th className="py-3 px-4 text-right font-medium">Importe</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {informeData.ordenes.map((orden) => (
                                                <tr key={orden.id} className="border-t border-gray-200">
                                                    <td className="py-3 px-4">{orden.numero}</td>
                                                    <td className="py-3 px-4">{orden.fecha}</td>
                                                    <td className="py-3 px-4">{orden.descripcion}</td>
                                                    <td className="py-3 px-4 text-right">{orden.importe.toLocaleString()} €</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-50">
                                            <tr className="border-t border-gray-200">
                                                <td colSpan="3" className="py-3 px-4 text-right font-semibold">Total:</td>
                                                <td className="py-3 px-4 text-right font-bold">
                                                    {informeData.ordenes.reduce((sum, orden) => sum + orden.importe, 0).toLocaleString()} €
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}