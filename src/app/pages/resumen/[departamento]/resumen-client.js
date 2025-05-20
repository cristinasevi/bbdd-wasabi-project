"use client"

import { useState, useMemo, useEffect } from "react"
import { Calendar, Info, Plus } from "lucide-react"
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

    // Estado para manejar el modal
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        cantidadPresupuesto: '',
        cantidadInversion: '',
        año: añoActual,
        departamentoId: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Estado para almacenar años que ya tienen bolsas
    const [existingYears, setExistingYears] = useState([]);

    // Depuración: monitorear datos recibidos del servidor
    useEffect(() => {
        console.log("Datos recibidos del servidor:");
        console.log("resumenprep:", resumenprep);
        console.log("resumeninv:", resumeninv);
        console.log("Año actual:", añoActual);
    }, [resumenprep, resumeninv, añoActual]);

    // Calcular presupuesto actual e inversión actual - CORREGIDO
    const presupuestoTotal = resumenprep?.[0]?.total_presupuesto || 0;

    // Calcular inversión total anual
    const inversionTotal = resumeninv?.[0]?.total_inversion || 0;

    // Calcular gasto en presupuesto solo del año actual (igual que inversiones)
    const gastoPresupuestoDelAñoActual = useMemo(() => {
        if (!resumenord || resumenord.length === 0) return 0;

        // Filtrar órdenes que NO tengan Num_inversion (son de presupuesto) Y sean del año actual
        const ordenesPresupuestoAñoActual = resumenord.filter(orden => {
            // No debe tener número de inversión
            if (orden.Num_inversion) return false;

            // Debe ser del año actual
            if (!orden.Fecha) return false;
            const ordenDate = new Date(orden.Fecha);
            const ordenAño = ordenDate.getFullYear();

            return ordenAño === añoActual;
        });

        // Sumar todos los importes
        return ordenesPresupuestoAñoActual.reduce((total, orden) => {
            return total + (parseFloat(orden.Importe) || 0);
        }, 0);
    }, [resumenord, añoActual]);

    // El presupuesto actual es presupuesto total menos gasto del año actual
    const presupuestoActual = presupuestoTotal - gastoPresupuestoDelAñoActual;

    // CORREGIDO: Calcular gasto de inversión solo del año actual
    const gastoInversionDelAño = useMemo(() => {
        if (!resumenord || resumenord.length === 0) return 0;

        // Filtrar órdenes que SÍ tengan Num_inversion y sean del año actual
        const ordenesInversionAñoActual = resumenord.filter(orden => {
            if (!orden.Num_inversion) return false;

            if (!orden.Fecha) return false;
            const ordenDate = new Date(orden.Fecha);
            const ordenAño = ordenDate.getFullYear();

            return ordenAño === añoActual;
        });

        // Sumar todos los importes
        return ordenesInversionAñoActual.reduce((total, orden) => {
            return total + (parseFloat(orden.Importe) || 0);
        }, 0);
    }, [resumenord, añoActual]);

    // Ahora usar el gasto filtrado por año
    const inversionActual = inversionTotal - gastoInversionDelAño;

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
            const ordenAño = ordenDate.getFullYear();

            // Solo mostrar órdenes del mes y año actual
            return ordenMes === mesActual && ordenAño === añoActual;
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

    // Handler para abrir el modal y establecer el departamento actual
    const handleOpenModal = async (e) => {
        // Prevenir la acción predeterminada para evitar cualquier navegación
        e.preventDefault();

        // Buscar el ID del departamento a partir del objeto resumenprep o resumeninv
        let departamentoId = null;
        if (resumenprep && resumenprep.length > 0) {
            departamentoId = resumenprep[0].id_DepartamentoFK;
        } else if (resumeninv && resumeninv.length > 0) {
            departamentoId = resumeninv[0].id_DepartamentoFK;
        }

        if (!departamentoId) {
            setError('No se puede determinar el departamento actual');
            return;
        }

        console.log("Abriendo modal para departamento:", departamento, "ID:", departamentoId);

        // Obtener años que ya tienen bolsas
        const existingYears = await fetchYearsWithExistingBolsas(departamentoId);
        setExistingYears(existingYears);

        // Configurar el formulario
        setFormData({
            cantidadPresupuesto: '',
            cantidadInversion: '',
            año: añoActual,
            departamentoId: departamentoId
        });

        // Limpiar mensajes de error o éxito previos
        setError('');
        setSuccess('');

        // Mostrar modal
        setShowModal(true);
    };

    // Handler para cerrar el modal
    const handleCloseModal = () => {
        setShowModal(false);
        setError('');
        setSuccess('');
    };

    // Handler para cambios en el formulario
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // Validar que sean solo números para los campos de cantidad
        if ((name === 'cantidadPresupuesto' || name === 'cantidadInversion')) {
            // Permitir solo números y punto decimal, rechazar incluso la 'e'
            if (!/^[0-9]*\.?[0-9]*$/.test(value)) {
                return;
            }

            // Verificar que no exceda el máximo de 200.000
            const numericValue = parseFloat(value || 0);
            if (numericValue > 200000) {
                return;
            }
        }

        setFormData({
            ...formData,
            [name]: value
        });
    };

    const fetchYearsWithExistingBolsas = async (departamentoId) => {
        try {
            // Llamar a un nuevo endpoint para obtener años con bolsas existentes
            const response = await fetch(`/api/getExistingYears?departamentoId=${departamentoId}`);
            if (response.ok) {
                const data = await response.json();
                return data.years || [];
            }
            return [];
        } catch (error) {
            console.error("Error al obtener años con bolsas existentes:", error);
            return [];
        }
    };

    // Handler para enviar el formulario
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validaciones
        if (!formData.departamentoId) {
            setError('No se puede determinar el departamento actual');
            return;
        }

        if (!formData.cantidadPresupuesto && !formData.cantidadInversion) {
            setError('Debe especificar al menos una cantidad para presupuesto o inversión');
            return;
        }

        // Preparar datos para enviar
        const dataToSend = {
            departamentoId: formData.departamentoId,
            año: parseInt(formData.año),
            cantidadPresupuesto: formData.cantidadPresupuesto ? parseFloat(formData.cantidadPresupuesto) : 0,
            cantidadInversion: formData.cantidadInversion ? parseFloat(formData.cantidadInversion) : 0
        };

        setLoading(true);
        setError('');

        try {
            console.log("Enviando datos:", dataToSend);

            // Llamar al endpoint para crear bolsas
            const response = await fetch('/api/createBolsas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataToSend)
            });

            const result = await response.json();
            console.log("Respuesta del servidor:", result);

            if (!response.ok) {
                throw new Error(result.error || 'Error al crear las bolsas presupuestarias');
            }

            // Cerrar el modal inmediatamente
            setShowModal(false);

            // Mostrar mensaje de éxito en la página principal en lugar de recargar
            setSuccess('Bolsas presupuestarias creadas correctamente. Por favor, actualice la página para ver los cambios.');

        } catch (err) {
            console.error('Error al crear bolsas:', err);
            setError(err.message || 'Error al crear las bolsas presupuestarias');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            {/* Encabezado */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Resumen</h1>
                    <h2 className="text-xl text-gray-400">Departamento {departamento}</h2>
                </div>
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
                                    <h3 className="text-gray-500 text-mb">Gasto en presupuesto acumulado {añoActual}</h3>
                                    <div className={`text-2xl font-bold ${gastoPresupuestoDelAñoActual > 0 ? "text-red-600" : "text-gray-900"}`}>
                                        {gastoPresupuestoDelAñoActual?.toLocaleString("es-ES", {
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
                                    <h3 className="text-gray-500 text-mb">Inversión acumulada {añoActual}</h3>
                                    <div className={`text-2xl font-bold ${gastoInversionDelAño > 0 ? "text-red-600" : "text-gray-900"}`}>
                                        {gastoInversionDelAño?.toLocaleString("es-ES", {
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

                        <div className="overflow-hidden max-h-[470px] overflow-y-auto">
                            <table className="w-full table-fixed">
                                <thead className="bg-white sticky top-0 z-10">
                                    <tr>
                                        <th className="pb-2 font-normal text-gray-500 text-left w-1/4 px-3">Número</th>
                                        <th className="pb-2 font-normal text-gray-500 text-left w-2/5 px-3">Descripción</th>
                                        <th className="pb-2 font-normal text-gray-500 text-left w-1/4 px-3">Fecha</th>
                                        <th className="pb-2 font-normal text-gray-500 text-right w-1/5 px-3">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrdenes?.length > 0 ? (
                                        filteredOrdenes.map((item) => (
                                            <tr key={`${item.idOrden}`} className="border-t border-gray-200">
                                                <td className="py-3 px-3 text-left w-1/4">
                                                    <div className="flex items-center gap-2">
                                                        <span>{item.Num_orden}</span>
                                                        {item.Num_inversion && (
                                                            <div className="relative group">
                                                                <Info className="w-4 h-4 text-blue-500" />
                                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-white border border-gray-200 rounded p-3 shadow-lg whitespace-nowrap z-50">
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
                                                <td className="py-3 px-3 text-left w-2/5">
                                                    <div className="truncate" title={item.Descripcion}>
                                                        {item.Descripcion || "-"}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-3 text-left w-1/4">{formatDate(item.Fecha)}</td>
                                                <td className="py-3 px-3 text-right w-1/5">
                                                    {parseFloat(item.Importe).toLocaleString("es-ES", {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2
                                                    })}€
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="py-4 px-3 text-center text-gray-400">
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
            {/* Botón para agregar bolsas */}
            <button
                onClick={handleOpenModal}
                className="bg-red-600 opacity-80 flex items-center gap-2 text-white px-4 py-3 rounded-md hover:bg-red-700 cursor-pointer"
                aria-label="Añadir nueva bolsa presupuestaria"
            >
                <Plus className="w-5 h-5" size={18} />
                <span className="text-mb">Añadir bolsa</span>
            </button>

            {/* Modal para agregar bolsas presupuestarias */}
            {showModal && (
                <div
                    className="fixed inset-0 flex items-center justify-center z-50"
                    style={{
                        backgroundColor: "rgba(0, 0, 0, 0.3)",
                        backdropFilter: "blur(2px)",
                    }}
                    onClick={(e) => {
                        // Cerrar el modal solo si se hace clic en el fondo, no en el contenido
                        if (e.target === e.currentTarget) {
                            handleCloseModal();
                        }
                    }}
                >
                    <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Añadir Nueva Bolsa</h2>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-500 hover:text-red-600"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Mensaje de error del formulario */}
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                                {error}
                            </div>
                        )}

                        {/* Mensaje de éxito */}
                        {success && (
                            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                                {success}
                            </div>
                        )}

                        {/* Formulario */}
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                {/* Año con select personalizado */}
                                <div>
                                    <label className="block text-gray-700 mb-1">Año *</label>
                                    <div className="relative">
                                        <select
                                            id="año"
                                            name="año"
                                            value={formData.año}
                                            onChange={handleInputChange}
                                            className="appearance-none border border-gray-300 rounded px-3 py-2 w-full pr-8"
                                            required
                                        >
                                            {/* Generar opciones para años disponibles */}
                                            {Array.from({ length: 6 }, (_, i) => añoActual + i)
                                                .filter(year => !existingYears.includes(year)) // Filtrar años que ya tienen bolsas
                                                .map(year => (
                                                    <option key={year} value={year}>{year}</option>
                                                ))
                                            }
                                            {/* Si no hay años disponibles, mostrar mensaje */}
                                            {Array.from({ length: 6 }, (_, i) => añoActual + i)
                                                .filter(year => !existingYears.includes(year)).length === 0 && (
                                                    <option value="" disabled>No hay años disponibles</option>
                                                )
                                            }
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                                            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 7l3 3 3-3" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Departamento (solo informativo) */}
                                <div>
                                    <label className="block text-gray-700 mb-1">Departamento</label>
                                    <input
                                        type="text"
                                        value={departamento}
                                        className="border border-gray-300 rounded px-3 py-2 w-full bg-gray-100"
                                        disabled
                                    />
                                </div>

                                {/* Cantidad Presupuesto */}
                                <div>
                                    <label className="block text-gray-700 mb-1">Cantidad Presupuesto (€) *</label>
                                    <input
                                        id="cantidadPresupuesto"
                                        name="cantidadPresupuesto"
                                        type="text"
                                        inputMode="decimal"
                                        value={formData.cantidadPresupuesto}
                                        onChange={handleInputChange}
                                        className="border border-gray-300 rounded px-3 py-2 w-full"
                                        placeholder="0.00"
                                        maxLength={9}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Dejar en blanco si no se quiere crear bolsa de presupuesto</p>
                                </div>

                                {/* Cantidad Inversión */}
                                <div>
                                    <label className="block text-gray-700 mb-1">Cantidad Inversión (€) *</label>
                                    <input
                                        id="cantidadInversion"
                                        name="cantidadInversion"
                                        type="text"
                                        inputMode="decimal"
                                        value={formData.cantidadInversion}
                                        onChange={handleInputChange}
                                        className="border border-gray-300 rounded px-3 py-2 w-full"
                                        placeholder="0.00"
                                        maxLength={9}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Dejar en blanco si no se quiere crear bolsa de inversión</p>
                                </div>
                            </div>

                            {/* Botones del formulario */}
                            <div className="flex justify-end gap-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 cursor-pointer"
                                    disabled={loading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-red-600 opacity-80 flex items-center gap-2 text-white px-4 py-3 rounded-md hover:bg-red-700 cursor-pointer"
                                >
                                    {loading ? "Guardando..." : "Guardar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}