"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronDown, FileText, Download, Share2, X } from "lucide-react"
import useUserDepartamento from "@/app/hooks/useUserDepartamento"
import useNotifications from "@/app/hooks/useNotifications"
import Image from 'next/image'

export default function Informes() {
    const { departamento, isLoading: isDepartamentoLoading } = useUserDepartamento()
    const { addNotification, notificationComponents } = useNotifications()
    const [userRole, setUserRole] = useState(null)
    const [loading, setLoading] = useState(false)
    
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

    // Se generan los años dinámicamente desde 2020 hasta hoy
    const currentYear = new Date().getFullYear();
    const años = Array.from({ length: currentYear - 2020 + 1 }, (_, i) => 2020 + i);
    
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
    
    // Función para generar el informe
    const handleGenerarInforme = async () => {
        // Validar que se haya seleccionado mes y año
        if (!mes || !ano) {
            addNotification("Por favor, selecciona mes y año para generar el informe", "warning")
            return
        }
        
        setGeneratingInforme(true)
        
        try {
            // En una implementación real, aquí se haría una llamada a la API
            // Por ahora, simularemos que obtenemos datos para el mes y año seleccionados
            
            // Simular un retraso para mostrar el estado de carga
            await new Promise(resolve => setTimeout(resolve, 1500))
            
            // Simular datos de informe
            const simulatedData = {
                titulo: `Informe de ${mes} ${ano}`,
                departamento: departamento || "Todos",
                fechaGeneracion: new Date().toLocaleDateString(),
                presupuestoTotal: Math.floor(Math.random() * 50000) + 20000,
                presupuestoGastado: Math.floor(Math.random() * 40000),
                inversionTotal: Math.floor(Math.random() * 30000) + 10000,
                inversionGastada: Math.floor(Math.random() * 20000),
                ordenes: Array.from({ length: 5 }, (_, i) => ({
                    id: i + 1,
                    numero: `${departamento?.substring(0, 4).toUpperCase() || 'ORD'}/${String(i + 1).padStart(3, '0')}/${ano.toString().substring(2)}/1`,
                    importe: Math.floor(Math.random() * 2000) + 500,
                    fecha: `${Math.floor(Math.random() * 28) + 1}/${meses.indexOf(mes) + 1}/${ano}`,
                    descripcion: `Compra de material ${i % 2 === 0 ? 'inventariable' : 'fungible'}`
                }))
            }
            
            setInformeData(simulatedData)
            setShowInformeModal(true)
            
        } catch (error) {
            console.error("Error generando informe:", error)
            addNotification("Error al generar el informe. Inténtalo de nuevo.", "error")
        } finally {
            setGeneratingInforme(false)
        }
    }
    
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
    
    // Función para compartir el informe
    const handleCompartirInforme = () => {
        // Si la API web Share está disponible, usarla
        if (navigator.share) {
            navigator.share({
                title: informeData?.titulo,
                text: `Informe financiero de ${mes} ${ano} para ${informeData?.departamento}`,
                // En una implementación real, aquí iría la URL del informe
                // url: 'https://tu-dominio.com/informes/compartido/123',
            })
            .then(() => addNotification("Informe compartido correctamente", "success"))
            .catch((error) => console.error("Error compartiendo:", error));
        } else {
            addNotification("La función de compartir no está disponible en este navegador", "info");
        }
    }
    
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
                        <div>
                            <label htmlFor="mes" className="block text-gray-700 mb-2">
                                Mes
                            </label>
                            <select
                                id="mes"
                                value={mes}
                                onChange={(e) => setMes(e.target.value)}
                                className="w-full bg-white px-4 py-3 border border-gray-300 text-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                                <option value="">Selecciona un mes</option>
                                {meses.map((mes, index) => (
                                    <option key={index} value={mes}>
                                        {mes}
                                    </option>
                                ))}
                            </select>
                        </div>
            
                        <div>
                            <label htmlFor="año" className="block text-gray-700 mb-2">
                                Año
                            </label>
                            <select
                                id="año"
                                value={ano}
                                onChange={(e) => setAno(e.target.value)}
                                className="w-full bg-white px-4 py-3 border border-gray-300 text-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                                <option value="">Selecciona un año</option>
                                {años.map((año) => (
                                    <option key={año} value={año}>
                                        {año}
                                    </option>
                                ))}
                            </select>
                        </div>
            
                        <button
                            type="button"
                            onClick={handleGenerarInforme}
                            disabled={generatingInforme}
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
                                
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleCompartirInforme}
                                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                                    >
                                        <Share2 className="w-4 h-4" />
                                        Compartir
                                    </button>
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