"use client"

import { useState, useMemo, useEffect } from "react"
import { ChevronDown, Pencil, X, Search, Filter, Check, Info } from "lucide-react";
import Button from "@/app/components/ui/button"
import useNotifications from "@/app/hooks/useNotifications"
import ConfirmationDialog from "@/app/components/ui/confirmation-dialog"
import useUserDepartamento from "@/app/hooks/useUserDepartamento"

export default function OrdenesCompraClient({
  initialOrdenes,
  initialDepartamentos,
  initialProveedores,
}) {
  // Obtener el departamento del usuario
  const { departamento, isLoading: isDepartamentoLoading } = useUserDepartamento();
  const [userRole, setUserRole] = useState(null);

  // Obtener el año actual
  const currentYear = new Date().getFullYear().toString().substring(2); // Solo tomamos los 2 últimos dígitos

  // Estados para los tipos de ordenes
  const [estadosOrden, setEstadosOrden] = useState([
    { id_EstadoOrden: 1, tipo: 'En proceso' },
    { id_EstadoOrden: 2, tipo: 'Anulada' },
    { id_EstadoOrden: 3, tipo: 'Confirmada' }
  ]);

  // Estados principales
  const [ordenes, setOrdenes] = useState(initialOrdenes);
  const [departamentos, setDepartamentos] = useState(Array.isArray(initialDepartamentos) ? initialDepartamentos : []);
  const [proveedores] = useState(initialProveedores);
  const [selectedOrdenes, setSelectedOrdenes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // 'add' o 'edit'
  const [formError, setFormError] = useState("");

  // Estado para tooltips/popovers de información detallada
  const [activeTooltip, setActiveTooltip] = useState(null);

  // Estados para búsqueda y filtrado
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartamento, setFilterDepartamento] = useState("");
  const [filterProveedor, setFilterProveedor] = useState("");
  const [filterInventariable, setFilterInventariable] = useState("");

  // Estado para diálogo de confirmación
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  
  // Hook de notificaciones
  const { addNotification, notificationComponents } = useNotifications();

  // Estado del formulario
  const [formularioOrden, setFormularioOrden] = useState({
    idOrden: null,
    numero: "",
    esInversion: false,
    numInversion: "",
    importe: "",
    fecha: "",
    descripcion: "",
    inventariable: false,
    cantidad: "",
    departamento: "",
    proveedor: "",
    estadoOrden: "En proceso",
  });
  
  // Efecto para obtener el rol del usuario
  useEffect(() => {
    async function fetchUserRole() {
      try {
        const response = await fetch('/api/getSessionUser');
        if (response.ok) {
          const data = await response.json();
          setUserRole(data.usuario?.rol || '');
          
          // Si es Jefe de Departamento, establecer el filtro automáticamente
          if (data.usuario?.rol === "Jefe de Departamento" && departamento) {
            setFilterDepartamento(departamento);
          }
        }
      } catch (error) {
        console.error("Error obteniendo rol del usuario:", error);
      }
    }

    fetchUserRole();
  }, [departamento]);

  // Obtenemos el siguiente número de orden para un departamento
  const getNextNumeroOrden = (departamentoCodigo) => {
    // Filtrar órdenes del mismo departamento y año
    const ordenesDelDepartamento = ordenes.filter(orden => {
      // Extraer el código de departamento de Num_orden (primeras letras antes de /)
      const ordenDepCodigo = orden.Num_orden?.split('/')[0];
      return ordenDepCodigo === departamentoCodigo;
    });
    
    // Si no hay órdenes previas, empezar con 001
    if (ordenesDelDepartamento.length === 0) {
      return '001';
    }
    
    // Buscar el número más alto y sumar 1
    let maxNumero = 0;
    ordenesDelDepartamento.forEach(orden => {
      // Extraer el número de orden (segundo segmento después del primer /)
      const numOrden = parseInt(orden.Num_orden?.split('/')[1], 10);
      if (!isNaN(numOrden) && numOrden > maxNumero) {
        maxNumero = numOrden;
      }
    });
    
    // Incrementar y formatear con leading zeros
    return (maxNumero + 1).toString().padStart(3, '0');
  };

  // Generar el código de orden automáticamente
  const generarNumeroOrden = () => {
    if (!formularioOrden.departamento) return "";
    
    // Obtener las primeras 4 letras del departamento para el código
    const departamentoCodigo = formularioOrden.departamento.substring(0, 4).toUpperCase();
    
    const numeroOrden = getNextNumeroOrden(departamentoCodigo);
    const esInventariable = formularioOrden.inventariable ? "1" : "0";
    
    // Formato: [DEPCOD]/[NUMORDEN]/[AÑO]/[0-1]
    return `${departamentoCodigo}/${numeroOrden}/${currentYear}/${esInventariable}`;
  };

  // Actualizar número orden cuando cambia departamento o inventariable
  useEffect(() => {
    if (modalMode === "add" && formularioOrden.departamento) {
      const nuevoNumeroOrden = generarNumeroOrden();
      setFormularioOrden(prev => ({
        ...prev,
        numero: nuevoNumeroOrden
      }));
    }
  }, [formularioOrden.departamento, formularioOrden.inventariable, modalMode]);

  // Generar número de inversión automáticamente
  const generarNumeroInversion = () => {
    if (!formularioOrden.departamento || !formularioOrden.esInversion) return "";
    
    // Buscar el departamento seleccionado para obtener su ID
    const departamentoSeleccionado = departamentos.find(
      dep => dep.Nombre === formularioOrden.departamento
    );
    
    if (!departamentoSeleccionado) return "";
    
    const idDepartamento = departamentoSeleccionado.id_Departamento;
    
    // Filtrar inversiones previas del mismo departamento
    const inversionesDepartamento = ordenes.filter(orden => {
      const ordenDep = orden.Departamento === formularioOrden.departamento;
      return ordenDep && orden.Num_inversion;
    });
    
    // Determinar el siguiente número
    let siguienteNumero = inversionesDepartamento.length + 1;
    
    // Formato: [ID_DEPARTAMENTO][00000X] - 7 dígitos en total
    return `${idDepartamento}${siguienteNumero.toString().padStart(6, '0')}`;
  };

  // Actualizar número de inversión cuando se activa la casilla
  useEffect(() => {
    if (formularioOrden.esInversion && !formularioOrden.numInversion) {
      setFormularioOrden(prev => ({
        ...prev,
        numInversion: generarNumeroInversion()
      }));
    } else if (!formularioOrden.esInversion) {
      setFormularioOrden(prev => ({
        ...prev,
        numInversion: ""
      }));
    }
  }, [formularioOrden.esInversion, formularioOrden.departamento]);

  // Función para formatear fechas
  function formatDate(dateString) {
    if (!dateString) return "-";
    if (dateString instanceof Date) {
      return dateString.toLocaleDateString();
    }
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      return dateString;
    }
  }

  // Función para formatear inventariable
  function formatInventariable(value) {
    if (value === 1 || value === "1" || value === true) return "Sí";
    if (value === 0 || value === "0" || value === false) return "No";
    return value || "-";
  }

  // Obtener proveedores filtrados por departamento
  const proveedoresFiltrados = useMemo(() => {
    if (!filterDepartamento) return proveedores;
    
    return proveedores.filter(proveedor => {
      return initialOrdenes.some(orden => 
        orden.Proveedor === proveedor.Nombre && orden.Departamento === filterDepartamento
      );
    });
  }, [filterDepartamento, proveedores, initialOrdenes]);

  // Reset proveedor cuando cambia departamento
  useMemo(() => {
    setFilterProveedor("");
  }, [filterDepartamento]);

  // Filtrar órdenes según los criterios de búsqueda y filtrado
  const filteredOrdenes = useMemo(() => {
    return ordenes.filter((orden) => {
      // Filtro por término de búsqueda (número, descripción)
      const matchesSearch =
        searchTerm === "" ||
        orden.Num_orden?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        orden.Descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        orden.Num_inversion?.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro por departamento
      const matchesDepartamento = filterDepartamento === "" || 
        orden.Departamento === filterDepartamento;

      // Filtro por proveedor
      const matchesProveedor = filterProveedor === "" || 
        orden.Proveedor === filterProveedor;

      // Filtro por inventariable
      const matchesInventariable = filterInventariable === "" || 
        (filterInventariable === "inventariable" && orden.Inventariable === 1) ||
        (filterInventariable === "no-inventariable" && orden.Inventariable === 0);

      return matchesSearch && matchesDepartamento && matchesProveedor && matchesInventariable;
    });
  }, [ordenes, searchTerm, filterDepartamento, filterProveedor, filterInventariable]);

  // Toggle selección de orden
  const toggleSelectOrden = (ordenId) => {
    if (selectedOrdenes.includes(ordenId)) {
      setSelectedOrdenes(selectedOrdenes.filter((id) => id !== ordenId));
    } else {
      setSelectedOrdenes([...selectedOrdenes, ordenId]);
    }
  };

  // Función para seleccionar/deseleccionar todas las órdenes mostradas
  const toggleSelectAll = () => {
    if (selectedOrdenes.length === filteredOrdenes.length) {
      setSelectedOrdenes([]);
    } else {
      setSelectedOrdenes(filteredOrdenes.map((o) => o.idOrden));
    }
  };

  // Abrir modal de añadir orden
  const handleOpenAddModal = () => {
    limpiarFormulario();
    
    // Si es Jefe de Departamento, preseleccionamos su departamento
    if (userRole === "Jefe de Departamento" && departamento) {
      setFormularioOrden(prev => ({
        ...prev,
        departamento: departamento
      }));
    }
    
    setModalMode("add");
    setShowModal(true);
  };

  // Añade la propiedad estadoOrden al objeto
  const handleOpenEditModal = (orden) => {
    const esInventariable = orden.Inventariable === 1 || orden.Inventariable === true;
    const esInversion = orden.Num_inversion ? true : false;
    
    setFormularioOrden({
      idOrden: orden.idOrden,
      numero: orden.Num_orden || "",
      esInversion: esInversion,
      numInversion: orden.Num_inversion || "",
      importe: orden.Importe || "",
      fecha: formatDateForInput(orden.Fecha) || "",
      descripcion: orden.Descripcion || "",
      inventariable: esInventariable,
      cantidad: orden.Cantidad || "",
      departamento: orden.Departamento || "",
      proveedor: orden.Proveedor || "",
      estadoOrden: orden.Estado || "En proceso", // Añade esta línea
    });
    setModalMode("edit");
    setShowModal(true);
  };

  // Formatear fecha para input
  function formatDateForInput(dateString) {
    if (!dateString) return "";
    if (dateString instanceof Date) {
      return dateString.toISOString().split('T')[0];
    }
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (error) {
      return dateString;
    }
  }

  // Cerrar modal
  const handleCloseModal = () => {
    setShowModal(false);
    setFormError("");
  };

  // Limpiar el formulario
  // Añade la propiedad estadoOrden al objeto que se resetea
  const limpiarFormulario = () => {
    setFormularioOrden({
      idOrden: null,
      numero: "",
      esInversion: false,
      numInversion: "",
      importe: "",
      fecha: formatDateForInput(new Date()),
      descripcion: "",
      inventariable: false,
      cantidad: "",
      departamento: "",
      proveedor: "",
      estadoOrden: "En proceso", // Añade esta línea
    });
    setFormError("");
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Para inputs de checkbox
    if (type === 'checkbox') {
      setFormularioOrden({
        ...formularioOrden,
        [name]: checked,
      });
      return;
    }
    
    setFormularioOrden({
      ...formularioOrden,
      [name]: value,
    });
  };

  // Validar formulario
  const validarFormulario = () => {
    if (!formularioOrden.departamento) {
      setFormError("Por favor, selecciona un departamento");
      return false;
    }
    if (!formularioOrden.proveedor) {
      setFormError("Por favor, selecciona un proveedor");
      return false;
    }
    if (!formularioOrden.importe) {
      setFormError("Por favor, ingresa el importe");
      return false;
    }
    if (!formularioOrden.fecha) {
      setFormError("Por favor, ingresa la fecha");
      return false;
    }
    if (!formularioOrden.descripcion) {
      setFormError("Por favor, ingresa la descripción");
      return false;
    }
    if (!formularioOrden.cantidad) {
      setFormError("Por favor, ingresa la cantidad");
      return false;
    }
    if (formularioOrden.esInversion && !formularioOrden.numInversion) {
      setFormError("Por favor, ingresa el número de inversión");
      return false;
    }

    setFormError("");
    return true;
  };

  // Guardar orden
  const handleGuardarOrden = async () => {
    if (!validarFormulario()) return;

    // Asegurar que el número de orden se genera
    if (!formularioOrden.numero) {
      setFormularioOrden({
        ...formularioOrden,
        numero: generarNumeroOrden()
      });
    }

    setIsLoading(true);

    try {
      // Encontrar los IDs necesarios
      const departamentoSeleccionado = departamentos.find(
        dep => dep.Nombre === formularioOrden.departamento
      );
      
      const proveedorSeleccionado = proveedores.find(
        prov => prov.Nombre === formularioOrden.proveedor
      );
      
      if (!departamentoSeleccionado || !proveedorSeleccionado) {
        throw new Error("No se encontró el departamento o proveedor seleccionado");
      }
      
      // Preparar los datos para enviar
      const ordenData = {
        Num_orden: formularioOrden.numero,
        Importe: parseFloat(formularioOrden.importe),
        Fecha: formularioOrden.fecha,
        Descripcion: formularioOrden.descripcion,
        Inventariable: formularioOrden.inventariable ? 1 : 0,
        Cantidad: parseInt(formularioOrden.cantidad),
        id_DepartamentoFK: departamentoSeleccionado.id_Departamento,
        id_ProveedorFK: proveedorSeleccionado.idProveedor,
        id_UsuarioFK: 1, // Aquí deberías obtener el usuario actual
        id_EstadoOrdenFK: 1, // Añade esta línea - Valor por defecto: "En proceso" (id 1)
      };
      
      // Añadir datos de inversión si es necesario
      if (formularioOrden.esInversion) {
        ordenData.Num_inversion = formularioOrden.numInversion;
        
        // Buscar ID de la bolsa de inversión para este departamento
        // Aquí podrías hacer una llamada a la API para obtener este ID
        ordenData.id_InversionFK = departamentoSeleccionado.id_Departamento; // Esto es una simplificación
      } else {
        // Si no es inversión, podría ir a presupuesto
        ordenData.id_PresupuestoFK = departamentoSeleccionado.id_Departamento; // Simplificación
      }

      let response;
      if (modalMode === "add") {
        // Lógica para añadir nueva orden
        response = await fetch("/api/getOrden", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(ordenData),
        });
      } else {
        // Lógica para editar orden existente
        ordenData.idOrden = formularioOrden.idOrden;
        response = await fetch(`/api/getOrden/${formularioOrden.idOrden}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(ordenData),
        });
      }

      if (!response.ok) {
        let errorMessage = `Error del servidor: ${response.status}`;
        
        // Intentar obtener detalles del error si están disponibles
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            // Si no es JSON, intentar obtener el texto del error
            const errorText = await response.text();
            if (errorText) {
              errorMessage = errorText;
            }
          }
        } catch (parseError) {
          console.error("Error al analizar la respuesta:", parseError);
          // Usamos el mensaje de error general que ya tenemos
        }
        
        throw new Error(errorMessage);
      }

      // Intentar analizar la respuesta como JSON si existe
      let responseData = {}; // Cambiado de 'data' a 'responseData'
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            responseData = await response.json();
          }
        } catch (parseError) {
          console.warn("No se pudo analizar la respuesta como JSON:", parseError);
          // No es crítico, continuamos con un objeto vacío
        }

      
      // Actualizar lista de órdenes
      if (modalMode === "add") {
        // Recargar órdenes desde el servidor para mayor consistencia
        const updatedOrdersResponse = await fetch("/api/getOrden");
        if (updatedOrdersResponse.ok) {
          const updatedOrders = await updatedOrdersResponse.json();
          setOrdenes(updatedOrders);
        } else {
          // Crear una versión local de la nueva orden para actualizar la UI
          const nuevaOrden = {
            idOrden: responseData.insertedId, // CAMBIADO data → responseData
            Num_orden: ordenData.Num_orden,
            Importe: ordenData.Importe,
            Fecha: ordenData.Fecha,
            Descripcion: ordenData.Descripcion,
            Inventariable: ordenData.Inventariable,
            Cantidad: ordenData.Cantidad,
            Departamento: formularioOrden.departamento,
            Proveedor: formularioOrden.proveedor,
            Num_inversion: formularioOrden.esInversion ? formularioOrden.numInversion : null,
          };
          setOrdenes([...ordenes, nuevaOrden]);
        }
      } else {
        // Actualizar orden existente en la lista local
        setOrdenes(
          ordenes.map((orden) =>
            orden.idOrden === formularioOrden.idOrden
              ? {
                  ...orden,
                  Num_orden: ordenData.Num_orden,
                  Importe: ordenData.Importe,
                  Fecha: ordenData.Fecha,
                  Descripcion: ordenData.Descripcion,
                  Inventariable: ordenData.Inventariable,
                  Cantidad: ordenData.Cantidad,
                  Departamento: formularioOrden.departamento,
                  Proveedor: formularioOrden.proveedor,
                  Num_inversion: formularioOrden.esInversion ? formularioOrden.numInversion : null,
                }
              : orden
          )
        );
      }

      addNotification(
        modalMode === "add" ? "Orden creada correctamente" : "Orden actualizada correctamente",
        "success"
      );

      handleCloseModal();
    } catch (error) {
      console.error("Error al guardar la orden:", error);
      addNotification(`Error al guardar la orden: ${error.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Eliminar órdenes seleccionadas
  const handleEliminarOrdenes = () => {
    if (selectedOrdenes.length === 0) {
      addNotification("Por favor, selecciona al menos una orden para eliminar", "warning");
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "Confirmar eliminación",
      message: `¿Estás seguro de que deseas eliminar ${selectedOrdenes.length} orden(es)? Esta acción no se puede deshacer.`,
      onConfirm: confirmDeleteOrdenes,
    });
  };

  // Confirmar eliminación de órdenes
  const confirmDeleteOrdenes = async () => {
    setIsLoading(true);
  
    try {
      // Cambiar a POST con un parámetro de acción
      const response = await fetch("/api/getOrden/eliminar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          action: "delete",
          ids: selectedOrdenes 
        }),
      });
  
      if (!response.ok) {
        let errorMessage = `Error del servidor: ${response.status}`;
        throw new Error(errorMessage);
      }
  
      // Procesar respuesta
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("Error al parsear la respuesta:", parseError);
        data = { deletedCount: selectedOrdenes.length };
      }
  
      // Actualizar lista local
      setOrdenes(ordenes.filter((o) => !selectedOrdenes.includes(o.idOrden)));
      setSelectedOrdenes([]);
      
      // Mostrar notificación de éxito
      addNotification(
        `${data?.deletedCount || selectedOrdenes.length} orden(es) eliminadas correctamente`, 
        "success"
      );
    } catch (error) {
      console.error("Error al eliminar órdenes:", error);
      addNotification(`Error al eliminar órdenes: ${error.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Mostramos un indicador de carga si estamos esperando el departamento
  if (isDepartamentoLoading) {
    return <div className="p-6">Cargando...</div>;
  }

  return (
    <div className="p-6">
      {/* Notificaciones */}
      {notificationComponents}

      {/* Diálogo de confirmación */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />

      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Orden de Compra</h1>
        <h2 className="text-xl text-gray-400">Departamento {departamento}</h2>
      </div>

      {/* Filtros y búsqueda */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por número, descripción..."
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
            {Array.isArray(departamentos) && departamentos.map(dep => (
              <option key={dep.id_Departamento || dep.id || dep._id} value={dep.Nombre}>
                {dep.Nombre}
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
            disabled={!filterDepartamento}
          >
            <option value="">
              {filterDepartamento ? "Todos los proveedores" : "Selecciona departamento"}
            </option>
            {proveedoresFiltrados.map((proveedor) => (
              <option key={proveedor.idProveedor} value={proveedor.Nombre}>
                {proveedor.Nombre}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </div>
        </div>

        <div className="relative">
          <select
            value={filterInventariable}
            onChange={(e) => setFilterInventariable(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md appearance-none"
          >
            <option value="">Todos</option>
            <option value="inventariable">Inventariable</option>
            <option value="no-inventariable">Fungible</option>
          </select>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Indicador de resultados */}
      <div className="mb-4 text-sm text-gray-500">
        Mostrando {filteredOrdenes.length} de {ordenes.length} órdenes
      </div>

      {/* TABLA REDISEÑADA PARA MEJOR VISUALIZACIÓN */}
      <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
        <div className="max-h-[450px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr className="border-b border-gray-200">
                <th className="py-2 px-1 w-8">
                  {filteredOrdenes.length > 0 && (
                    <input
                      type="checkbox"
                      checked={
                        selectedOrdenes.length === filteredOrdenes.length &&
                        filteredOrdenes.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="h-4 w-4 text-red-600 border-gray-300 rounded"
                    />
                  )}
                </th>
                {/* Columnas reducidas y reorganizadas */}
                <th className="text-left py-2 px-2 font-medium text-gray-600">Num.Orden</th>
                <th className="text-left py-2 px-2 font-medium text-gray-600">Descripción</th>
                <th className="text-center py-2 px-2 font-medium text-gray-600">Fecha</th>
                <th className="text-center py-2 px-2 font-medium text-gray-600">Importe</th>
                <th className="text-center py-2 px-1 font-medium text-gray-600">Inv.</th>
                <th className="text-center py-2 px-1 font-medium text-gray-600">Cant.</th>
                <th className="text-left py-2 px-2 font-medium text-gray-600">Dep./Prov.</th>
                <th className="text-center py-2 px-2 font-medium text-gray-600">Estado</th>
                <th className="py-2 px-1 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {filteredOrdenes.length > 0 ? (
                filteredOrdenes.map((orden) => (
                  <tr
                    key={orden.idOrden}
                    className={`border-t border-gray-200 cursor-pointer hover:bg-gray-50 ${
                      selectedOrdenes.includes(orden.idOrden) ? "bg-red-50 hover:bg-red-100" : ""
                    }`}
                    onClick={() => toggleSelectOrden(orden.idOrden)}
                  >
                    <td className="py-2 px-1 text-center w-8" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedOrdenes.includes(orden.idOrden)}
                        onChange={() => toggleSelectOrden(orden.idOrden)}
                        className="h-4 w-4 text-red-600 border-gray-300 rounded"
                      />
                    </td>
                    {/* Número de Orden con tooltip para Inversión */}
                    <td className="py-2 px-2 relative">
                      <div className="flex items-center">
                        <span className="truncate max-w-[100px]" title={orden.Num_orden}>{orden.Num_orden}</span>
                        {orden.Num_inversion && (
                          <div className="ml-1 relative" 
                               onMouseEnter={() => setActiveTooltip(`inv-${orden.idOrden}`)}
                               onMouseLeave={() => setActiveTooltip(null)}>
                            <Info className="h-3 w-3 text-blue-500" />
                            
                            {activeTooltip === `inv-${orden.idOrden}` && (
                              <div className="absolute z-50 top-6 left-0 bg-white border border-gray-200 rounded p-2 shadow-lg text-xs w-36">
                                <p className="font-semibold">Núm. Inversión:</p>
                                <p>{orden.Num_inversion}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    {/* Descripción */}
                    <td className="py-2 px-2">
                      <div className="truncate max-w-[200px]" title={orden.Descripcion}>{orden.Descripcion}</div>
                    </td>
                    
                    {/* Fecha */}
                    <td className="py-2 px-2 text-center">
                      {formatDate(orden.Fecha)}
                    </td>
                    
                    {/* Importe */}
                    <td className="py-2 px-2 text-right font-medium">
                      {orden.Importe}€
                    </td>
                    
                    {/* Inventariable */}
                    <td className="py-2 px-1 text-center">
                      {orden.Inventariable === 1 || orden.Inventariable === true ? (
                        <div className="flex justify-center">
                          <Check className="w-4 h-4 text-green-500" />
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <X className="w-4 h-4 text-red-500" />
                        </div>
                      )}
                    </td>
                    
                    {/* Cantidad */}
                    <td className="py-2 px-1 text-center">
                      {orden.Cantidad}
                    </td>
                    
                    {/* Departamento y Proveedor (combinados) */}
                    <td className="py-2 px-2 relative">
                      <div className="flex flex-col">
                        <span className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-xs truncate max-w-[120px]" 
                              title={orden.Departamento}>
                          {orden.Departamento}
                        </span>
                        <span className="text-xs truncate max-w-[120px]" title={orden.Proveedor}>
                          {orden.Proveedor}
                        </span>
                      </div>
                    </td>
                    
                    {/* Estado */}
                    <td className="py-2 px-2 text-center">
                      <span 
                        className={`px-2 py-1 rounded-full text-xs font-medium inline-block
                          ${orden.Estado === 'En proceso' ? 'bg-yellow-300 text-yellow-800' : 
                            orden.Estado === 'Anulada' ? 'bg-red-100 text-red-800' : 
                            'bg-green-100 text-green-800'}`}
                      >
                        {orden.Estado || "En proceso"}
                      </span>
                    </td>
                    
                    {/* Editar */}
                    <td className="py-2 px-1 text-center w-8">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditModal(orden);
                        }}
                        className="text-gray-500 hover:text-red-600"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="py-6 text-center text-gray-500">
                    No se encontraron órdenes{" "}
                    {searchTerm || filterDepartamento || filterProveedor || filterInventariable
                      ? "con los criterios de búsqueda actuales"
                      : ""}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex justify-between mb-6">
        <Button onClick={handleOpenAddModal}>Nueva Orden</Button>
        <Button
          onClick={handleEliminarOrdenes}
          disabled={selectedOrdenes.length === 0 || isLoading}
        >
          {isLoading
            ? "Procesando..."
            : `Eliminar ${selectedOrdenes.length > 0 ? `(${selectedOrdenes.length})` : ""}`}
        </Button>
      </div>

      {/* Modal para añadir/editar orden */}
      {showModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            backdropFilter: "blur(2px)",
          }}
        >
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {modalMode === "add" ? "Añadir Nueva Orden" : "Editar Orden"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-red-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Mensaje de error del formulario */}
            {formError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {formError}
              </div>
            )}

            {/* Formulario */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Campos principales */}
              <div>
                <label className="block text-gray-700 mb-1">Departamento *</label>
                <div className="relative">
                  <select
                    name="departamento"
                    value={formularioOrden.departamento}
                    onChange={handleInputChange}
                    className="appearance-none border border-gray-300 rounded px-3 py-2 w-full pr-8 text-gray-500"
                    required
                    disabled={userRole === "Jefe de Departamento"} // Deshabilitar si es jefe de departamento
                  >
                    <option value="">Seleccionar departamento</option>
                    {departamentos.map((departamento) => (
                      <option key={departamento.id_Departamento} value={departamento.Nombre}>
                        {departamento.Nombre}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Proveedor *</label>
                <div className="relative">
                  <select
                    name="proveedor"
                    value={formularioOrden.proveedor}
                    onChange={handleInputChange}
                    className="appearance-none border border-gray-300 rounded px-3 py-2 w-full pr-8 text-gray-500"
                    required
                  >
                    <option value="">Seleccionar proveedor</option>
                    {proveedores.map((proveedor) => (
                      <option key={proveedor.idProveedor} value={proveedor.Nombre}>
                        {proveedor.Nombre}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Importe (€) *</label>
                <input
                  type="number"
                  step="0.01"
                  name="importe"
                  value={formularioOrden.importe}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Fecha *</label>
                <input
                  type="date"
                  name="fecha"
                  value={formularioOrden.fecha}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded px-3 py-2 w-full text-gray-500"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-1">Descripción *</label>
                <input
                  type="text"
                  name="descripcion"
                  value={formularioOrden.descripcion}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                  placeholder="Descripción del artículo o servicio"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Cantidad *</label>
                <input
                  type="number"
                  min="1"
                  name="cantidad"
                  value={formularioOrden.cantidad}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                  placeholder="1"
                  required
                />
              </div>
              
              {/* Campos para tipo y número de orden */}
              <div className="flex flex-col">
                <label className="block text-gray-700 mb-1">Tipo *</label>
                <div className="flex items-center space-x-6 py-2">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      name="inventariable"
                      checked={formularioOrden.inventariable}
                      onChange={handleInputChange}
                      className="form-checkbox h-5 w-5 text-red-600"
                    />
                    <span className="ml-2">Inventariable</span>
                  </label>
                  <span className="text-gray-500">
                    {!formularioOrden.inventariable && "Fungible"}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">
                  Número Orden
                  <span className="ml-2 text-gray-500 text-xs">
                    (generado automáticamente)
                  </span>
                </label>
                <input
                  type="text"
                  name="numero"
                  value={formularioOrden.numero}
                  className="border border-gray-300 rounded px-3 py-2 w-full bg-gray-100"
                  placeholder={formularioOrden.departamento ? "Se generará al guardar" : "Selecciona departamento"}
                  disabled
                />
              </div>
              
              {/* Casilla y campo para inversión */}
              <div className="flex flex-col">
                <label className="block text-gray-700 mb-1">Inversión</label>
                <div className="flex items-center space-x-4 py-2">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      name="esInversion"
                      checked={formularioOrden.esInversion}
                      onChange={handleInputChange}
                      className="form-checkbox h-5 w-5 text-red-600"
                    />
                    <span className="ml-2">Es inversión</span>
                  </label>
                  {formularioOrden.esInversion && (
                    <div className="flex items-center">
                      <Info className="w-4 h-4 text-gray-400 mr-1" />
                      <span className="text-xs text-gray-500">
                        Se cargará a inversiones
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {formularioOrden.esInversion && (
                <div>
                  <label className="block text-gray-700 mb-1">
                    Número Inversión *
                    <span className="ml-2 text-gray-500 text-xs">
                      (generado automáticamente)
                    </span>
                  </label>
                  <input
                    type="text"
                    name="numInversion"
                    value={formularioOrden.numInversion}
                    onChange={handleInputChange}
                    className="border border-gray-300 rounded px-3 py-2 w-full bg-gray-100"
                    placeholder={formularioOrden.departamento ? "Se generará al guardar" : "Selecciona departamento"}
                    disabled
                  />
                </div>
              )}
              
              {/* Estado de la orden */}
              <div>
                <label className="block text-gray-700 mb-1">Estado</label>
                <div className="relative">
                  <select
                    name="estadoOrden"
                    value={formularioOrden.estadoOrden}
                    onChange={handleInputChange}
                    className="appearance-none border border-gray-300 rounded px-3 py-2 w-full pr-8 text-gray-500"
                  >
                    {estadosOrden.map(estado => (
                      <option key={estado.id_EstadoOrden} value={estado.tipo}>
                        {estado.tipo}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Botones del formulario */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                disabled={isLoading}
              >
                Cancelar
              </button>
              <Button
                onClick={handleGuardarOrden}
                disabled={isLoading}
              >
                {isLoading ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}