"use client"

import { useState, useMemo, useEffect } from "react" // Añadimos useEffect
import { ChevronDown, Pencil, X, Search, Filter } from "lucide-react"
import Button from "@/app/components/ui/button"
import useNotifications from "@/app/hooks/useNotifications"
import ConfirmationDialog from "@/app/components/ui/confirmation-dialog"
import useUserDepartamento from "@/app/hooks/useUserDepartamento" // Importamos el hook

export default function InventarioClient({
  initialInventarios,
  initialDepartamentos,
  initialProveedores,
}) {
  // Obtenemos el departamento del usuario
  const { departamento, isLoading: isDepartamentoLoading } = useUserDepartamento()
  const [userRole, setUserRole] = useState(null) // Estado para el rol del usuario
  
  // Estados principales
  const [inventarios, setInventarios] = useState(initialInventarios);
  const [departamentos] = useState(initialDepartamentos);
  const [proveedores] = useState(initialProveedores);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // 'add' o 'edit'
  const [formError, setFormError] = useState("");

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
  const [formularioItem, setFormularioItem] = useState({
    idOrden: null,
    descripcion: "",
    proveedor: "",
    departamento: "",
    cantidad: "",
    inventariable: "",
  });

  // Efecto para obtener el rol del usuario y configurar filtros iniciales
  useEffect(() => {
    async function fetchUserRole() {
      try {
        const response = await fetch('/api/getSessionUser')
        if (response.ok) {
          const data = await response.json()
          const role = data.usuario?.rol || ''
          setUserRole(role)
          
          // Si es Jefe de Departamento, establecer el filtro automáticamente
          if (role === "Jefe de Departamento" && departamento) {
            setFilterDepartamento(departamento)
          }
        }
      } catch (error) {
        console.error("Error obteniendo rol del usuario:", error)
      }
    }

    fetchUserRole()
  }, [departamento])

  // Proveedores filtrados por departamento
  const proveedoresFiltrados = useMemo(() => {
    if (!filterDepartamento) return proveedores;
    
    return proveedores.filter(proveedor => {
      return inventarios.some(item => 
        item.Proveedor === proveedor.Nombre && item.Departamento === filterDepartamento
      );
    });
  }, [filterDepartamento, proveedores, inventarios]);

  // Reset proveedor cuando cambia departamento
  useMemo(() => {
    setFilterProveedor("");
  }, [filterDepartamento]);

  // Filtrar inventarios según los criterios de búsqueda y filtrado
  const filteredInventarios = useMemo(() => {
    return inventarios.filter((item) => {
      // Filtro por término de búsqueda (descripción)
      const matchesSearch =
        searchTerm === "" ||
        (item.Descripcion && item.Descripcion.toLowerCase().includes(searchTerm.toLowerCase()));

      // Filtro por departamento
      const matchesDepartamento = filterDepartamento === "" || 
        item.Departamento === filterDepartamento;

      // Filtro por proveedor
      const matchesProveedor = filterProveedor === "" || 
        item.Proveedor === filterProveedor;

      // Filtro por inventariable
      const matchesInventariable = filterInventariable === "" || 
        (filterInventariable === "inventariable" && item.Inventariable === 1) ||
        (filterInventariable === "no-inventariable" && item.Inventariable === 0);

      return matchesSearch && matchesDepartamento && matchesProveedor && matchesInventariable;
    });
  }, [inventarios, searchTerm, filterDepartamento, filterProveedor, filterInventariable]);

  // Toggle selección de item
  const toggleSelectItem = (itemId) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter((id) => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  // Función para seleccionar/deseleccionar todos los items mostrados
  const toggleSelectAll = () => {
    if (selectedItems.length === filteredInventarios.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredInventarios.map((i) => i.idOrden));
    }
  };

  // Abrir modal de añadir item
  const handleOpenAddModal = () => {
    limpiarFormulario();
    
    // Si es Jefe de Departamento, preseleccionamos su departamento
    if (userRole === "Jefe de Departamento" && departamento) {
      setFormularioItem(prev => ({
        ...prev,
        departamento: departamento
      }));
    }
    
    setModalMode("add");
    setShowModal(true);
  };

  // Abrir modal de editar item
  const handleOpenEditModal = (item) => {
    setFormularioItem({
      idOrden: item.idOrden,
      descripcion: item.Descripcion || "",
      proveedor: item.Proveedor || "",
      departamento: item.Departamento || "",
      cantidad: item.Cantidad || "",
      inventariable: item.Inventariable === 1 ? "Sí" : "No",
    });
    setModalMode("edit");
    setShowModal(true);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setShowModal(false);
    setFormError("");
  };

  // Limpiar el formulario
  const limpiarFormulario = () => {
    setFormularioItem({
      idOrden: null,
      descripcion: "",
      proveedor: "",
      departamento: "",
      cantidad: "",
      inventariable: "",
    });
    setFormError("");
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormularioItem({
      ...formularioItem,
      [name]: value,
    });
  };

  // Validar formulario
  const validarFormulario = () => {
    if (!formularioItem.descripcion) {
      setFormError("Por favor, ingresa la descripción del item");
      return false;
    }
    if (!formularioItem.cantidad) {
      setFormError("Por favor, ingresa la cantidad");
      return false;
    }
    if (!formularioItem.inventariable) {
      setFormError("Por favor, indica si el item es inventariable");
      return false;
    }
    if (!formularioItem.departamento) {
      setFormError("Por favor, selecciona un departamento");
      return false;
    }
    if (!formularioItem.proveedor) {
      setFormError("Por favor, selecciona un proveedor");
      return false;
    }

    setFormError("");
    return true;
  };

  // Guardar item
  const handleGuardarItem = async () => {
    if (!validarFormulario()) return;

    setIsLoading(true);

    try {
      // Implementar la lógica para guardar en la base de datos
      // Por ahora solo actualizamos la UI localmente
      if (modalMode === "add") {
        const nuevoItem = {
          idOrden: Date.now(), // ID temporal
          Descripcion: formularioItem.descripcion,
          Proveedor: formularioItem.proveedor,
          Departamento: formularioItem.departamento,
          Cantidad: parseInt(formularioItem.cantidad),
          Inventariable: formularioItem.inventariable === "Sí" ? 1 : 0,
        };
        
        setInventarios([...inventarios, nuevoItem]);
      } else {
        setInventarios(
          inventarios.map((item) =>
            item.idOrden === formularioItem.idOrden
              ? {
                  ...item,
                  Descripcion: formularioItem.descripcion,
                  Proveedor: formularioItem.proveedor,
                  Departamento: formularioItem.departamento,
                  Cantidad: parseInt(formularioItem.cantidad),
                  Inventariable: formularioItem.inventariable === "Sí" ? 1 : 0,
                }
              : item
          )
        );
      }

      addNotification(
        modalMode === "add" ? "Item añadido correctamente" : "Item actualizado correctamente",
        "success"
      );

      handleCloseModal();
    } catch (error) {
      console.error("Error al guardar el item:", error);
      addNotification(`Error al guardar el item: ${error.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Eliminar items seleccionados
  const handleEliminarItems = () => {
    if (selectedItems.length === 0) {
      addNotification("Por favor, selecciona al menos un item para eliminar", "warning");
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "Confirmar eliminación",
      message: `¿Estás seguro de que deseas eliminar ${selectedItems.length} item(s)? Esta acción no se puede deshacer.`,
      onConfirm: confirmDeleteItems,
    });
  };

  // Confirmar eliminación de items
  const confirmDeleteItems = async () => {
    setIsLoading(true);

    try {
      // Implementar la lógica para eliminar de la base de datos
      // Por ahora solo actualizamos la UI localmente
      setInventarios(inventarios.filter((i) => !selectedItems.includes(i.idOrden)));
      setSelectedItems([]);
      addNotification(`${selectedItems.length} item(s) eliminados correctamente`, "success");
    } catch (error) {
      console.error("Error al eliminar items:", error);
      addNotification(`Error al eliminar items: ${error.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Función para formatear el estado de inventariable
  function formatInventariable(value) {
    if (value === 1 || value === "1" || value === true) return "Sí";
    if (value === 0 || value === "0" || value === false) return "No";
    return value || "-";
  }
  
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
        <h1 className="text-3xl font-bold">Inventario</h1>
        <h2 className="text-xl text-gray-400">Departamento {departamento}</h2>
      </div>

      {/* Filtros y búsqueda */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por descripción..."
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
            {departamentos.map((departamento) => (
              <option key={departamento.id_Departamento} value={departamento.Nombre}>
                {departamento.Nombre}
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
            <option value="no-inventariable">No Inventariable</option>
          </select>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Indicador de resultados */}
      <div className="mb-4 text-sm text-gray-500">
        Mostrando {filteredInventarios.length} de {inventarios.length} items
      </div>

      {/* Tabla de inventario */}
      <div className="border border-gray-200 rounded-lg overflow-hidden mb-6 max-h-[500px] overflow-y-auto">
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="py-3 px-4 w-10">
                {filteredInventarios.length > 0 && (
                  <input
                    type="checkbox"
                    checked={
                      selectedItems.length === filteredInventarios.length &&
                      filteredInventarios.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="h-4 w-4 text-red-600 border-gray-300 rounded"
                  />
                )}
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Descripción</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Proveedor</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Departamento</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Cantidad</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Inventariable</th>
              <th className="py-3 px-4 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {filteredInventarios.length > 0 ? (
              filteredInventarios.map((item) => (
                <tr
                  key={item.idOrden}
                  className={`border-t border-gray-200 cursor-pointer ${
                    selectedItems.includes(item.idOrden) ? "bg-red-50" : ""
                  }`}
                  onClick={() => toggleSelectItem(item.idOrden)}
                >
                  <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.idOrden)}
                      onChange={() => toggleSelectItem(item.idOrden)}
                      className="h-4 w-4 text-red-600 border-gray-300 rounded"
                    />
                  </td>
                  <td className="py-3 px-4">{item.Descripcion}</td>
                  <td className="py-3 px-4">{item.Proveedor}</td>
                  <td className="py-3 px-4">
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                      {item.Departamento}
                    </span>
                  </td>
                  <td className="py-3 px-4">{item.Cantidad}</td>
                  <td className="py-3 px-4">{formatInventariable(item.Inventariable)}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditModal(item);
                      }}
                      className="text-gray-500 hover:text-red-600"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="py-6 text-center text-gray-500">
                  No se encontraron items{" "}
                  {searchTerm || filterDepartamento || filterProveedor || filterInventariable
                    ? "con los criterios de búsqueda actuales"
                    : ""}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end mb-6">
        <Button
          onClick={handleEliminarItems}
          disabled={selectedItems.length === 0 || isLoading}
        >
          {isLoading
            ? "Procesando..."
            : `Eliminar ${selectedItems.length > 0 ? `(${selectedItems.length})` : ""}`}
        </Button>
      </div>

      {/* Modal para añadir/editar item */}
      {showModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            backdropFilter: "blur(2px)"
          }}
        >
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {modalMode === "add" ? "Añadir Nuevo Item" : "Editar Item"}
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
              <div>
                <label className="block text-gray-700 mb-1">Descripción</label>
                <input
                  type="text"
                  name="descripcion"
                  value={formularioItem.descripcion}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                  placeholder="Descripción"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Cantidad</label>
                <input
                  type="number"
                  name="cantidad"
                  value={formularioItem.cantidad}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                  placeholder="Cantidad"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Inventariable</label>
                <div className="relative">
                  <select
                    name="inventariable"
                    value={formularioItem.inventariable}
                    onChange={handleInputChange}
                    className="appearance-none border border-gray-300 rounded px-3 py-2 w-full pr-8 text-gray-500"
                  >
                    <option value="">Seleccionar</option>
                    <option value="Sí">Sí</option>
                    <option value="No">No</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Departamento</label>
                <div className="relative">
                  <select
                    name="departamento"
                    value={formularioItem.departamento}
                    onChange={handleInputChange}
                    className="appearance-none border border-gray-300 rounded px-3 py-2 w-full pr-8 text-gray-500"
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
                <label className="block text-gray-700 mb-1">Proveedor</label>
                <div className="relative">
                  <select
                    name="proveedor"
                    value={formularioItem.proveedor}
                    onChange={handleInputChange}
                    className="appearance-none border border-gray-300 rounded px-3 py-2 w-full pr-8 text-gray-500"
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
            </div>

            {/* Botones del formulario */}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Cancelar
              </button>
              <Button onClick={handleGuardarItem} disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}