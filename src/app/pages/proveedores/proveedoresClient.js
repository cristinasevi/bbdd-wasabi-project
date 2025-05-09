"use client";

import { useState, useMemo, useEffect } from "react"; // Añadimos useEffect
import { ChevronDown, Pencil, X, Search, Filter } from "lucide-react";
import Button from "@/app/components/ui/button";
import useNotifications from "@/app/hooks/useNotifications";
import ConfirmationDialog from "@/app/components/ui/confirmation-dialog";
import useUserDepartamento from "@/app/hooks/useUserDepartamento";

export default function ProveedoresClient({
  initialProveedores,
  initialDepartamentos,
}) {
  // Agregamos el hook para obtener el departamento del usuario
  const { departamento, isLoading: isDepartamentoLoading } = useUserDepartamento();
  const [userRole, setUserRole] = useState(null); // Añadimos estado para el rol
  
  // Estados principales
  const [proveedores, setProveedores] = useState(initialProveedores);
  const [departamentos] = useState(initialDepartamentos);
  const [selectedProveedores, setSelectedProveedores] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // 'add' o 'edit'
  const [formError, setFormError] = useState("");

  // Estados para búsqueda y filtrado
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartamento, setFilterDepartamento] = useState("");
  
  // Efecto para obtener el rol del usuario
  useEffect(() => {
    async function fetchUserRole() {
      try {
        const response = await fetch('/api/getSessionUser');
        if (response.ok) {
          const data = await response.json();
          const role = data.usuario?.rol || '';
          setUserRole(role);
          
          // Si es Jefe de Departamento, establecer el filtro automáticamente
          if (role === "Jefe de Departamento" && departamento) {
            setFilterDepartamento(departamento);
          }
        }
      } catch (error) {
        console.error("Error obteniendo rol del usuario:", error);
      }
    }
    
    fetchUserRole();
  }, [departamento]);

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
  const [formularioProveedor, setFormularioProveedor] = useState({
    idProveedor: null,
    nombre: "",
    nif: "",
    direccion: "",
    telefono: "",
    email: "",
    departamento: "",
  });

  // Filtrar proveedores según los criterios de búsqueda y filtrado
  const filteredProveedores = useMemo(() => {
    return proveedores.filter((proveedor) => {
      // Filtro por término de búsqueda (nombre, nif, email)
      const matchesSearch =
        searchTerm === "" ||
        (proveedor.Nombre && proveedor.Nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (proveedor.NIF && proveedor.NIF.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (proveedor.Email && proveedor.Email.toLowerCase().includes(searchTerm.toLowerCase()));

      // Filtro por departamento
      const matchesDepartamento =
        filterDepartamento === "" || proveedor.Departamento === filterDepartamento;

      return matchesSearch && matchesDepartamento;
    });
  }, [proveedores, searchTerm, filterDepartamento]);

  // Toggle selección de proveedor
  const toggleSelectProveedor = (proveedorId) => {
    if (selectedProveedores.includes(proveedorId)) {
      setSelectedProveedores(selectedProveedores.filter((id) => id !== proveedorId));
    } else {
      setSelectedProveedores([...selectedProveedores, proveedorId]);
    }
  };

  // Función para seleccionar/deseleccionar todos los proveedores mostrados
  const toggleSelectAll = () => {
    if (selectedProveedores.length === filteredProveedores.length) {
      setSelectedProveedores([]);
    } else {
      setSelectedProveedores(filteredProveedores.map((p) => p.idProveedor));
    }
  };

  // Abrir modal de añadir proveedor
  const handleOpenAddModal = () => {
    limpiarFormulario();
    
    // Si es Jefe de Departamento, preseleccionamos su departamento
    if (userRole === "Jefe de Departamento" && departamento) {
      setFormularioProveedor(prev => ({
        ...prev,
        departamento: departamento
      }));
    }
    
    setModalMode("add");
    setShowModal(true);
  };

  // Abrir modal de editar proveedor
  const handleOpenEditModal = (proveedor) => {
    setFormularioProveedor({
      idProveedor: proveedor.idProveedor,
      nombre: proveedor.Nombre || "",
      nif: proveedor.NIF || "",
      direccion: proveedor.Direccion || "",
      telefono: proveedor.Telefono || "",
      email: proveedor.Email || "",
      departamento: proveedor.Departamento || "",
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
    setFormularioProveedor({
      idProveedor: null,
      nombre: "",
      nif: "",
      direccion: "",
      telefono: "",
      email: "",
      departamento: "",
    });
    setFormError("");
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormularioProveedor({
      ...formularioProveedor,
      [name]: value,
    });
  };

  // Validar formulario
  const validarFormulario = () => {
    if (!formularioProveedor.nombre) {
      setFormError("Por favor, ingresa el nombre del proveedor");
      return false;
    }
    if (!formularioProveedor.nif) {
      setFormError("Por favor, ingresa el NIF del proveedor");
      return false;
    }
    if (!formularioProveedor.departamento) {
      setFormError("Por favor, selecciona un departamento");
      return false;
    }

    setFormError("");
    return true;
  };

  // Guardar proveedor
  const handleGuardarProveedor = async () => {
    if (!validarFormulario()) return;

    setIsLoading(true);

    try {
      let response;
      if (modalMode === "add") {
        // Lógica para añadir nuevo proveedor
        response = await fetch("/api/getProveedores", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nombre: formularioProveedor.nombre,
            nif: formularioProveedor.nif,
            direccion: formularioProveedor.direccion,
            telefono: formularioProveedor.telefono,
            email: formularioProveedor.email,
            departamento: formularioProveedor.departamento,
          }),
        });
      } else {
        // Lógica para editar proveedor existente
        response = await fetch(`/api/getProveedores/${formularioProveedor.idProveedor}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nombre: formularioProveedor.nombre,
            nif: formularioProveedor.nif,
            direccion: formularioProveedor.direccion,
            telefono: formularioProveedor.telefono,
            email: formularioProveedor.email,
            departamento: formularioProveedor.departamento,
          }),
        });
      }

      if (response?.ok) {
        // Actualizar lista de proveedores
        const updatedProveedores = await fetch("/api/getProveedores").then((res) => res.json());
        setProveedores(updatedProveedores);

        addNotification(
          modalMode === "add"
            ? "Proveedor creado correctamente"
            : "Proveedor actualizado correctamente",
          "success"
        );

        handleCloseModal();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al guardar el proveedor");
      }
    } catch (error) {
      console.error("Error al guardar el proveedor:", error);
      addNotification(`Error al guardar el proveedor: ${error.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Eliminar proveedores seleccionados
  const handleEliminarProveedores = () => {
    if (selectedProveedores.length === 0) {
      addNotification("Por favor, selecciona al menos un proveedor para eliminar", "warning");
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "Confirmar eliminación",
      message: `¿Estás seguro de que deseas eliminar ${selectedProveedores.length} proveedor(es)? Esta acción no se puede deshacer.`,
      onConfirm: confirmDeleteProveedores,
    });
  };

  // Confirmar eliminación de proveedores
  const confirmDeleteProveedores = async () => {
    setIsLoading(true);

    try {
      // Aquí implementarías la API para eliminar proveedores
      // Por ahora solo actualizamos la UI localmente
      const response = await fetch("/api/getProveedores", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: selectedProveedores }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al eliminar proveedores");
      }

      setProveedores(proveedores.filter((p) => !selectedProveedores.includes(p.idProveedor)));
      setSelectedProveedores([]);
      addNotification(`${selectedProveedores.length} proveedor(es) eliminados correctamente`, "success");
    } catch (error) {
      console.error("Error al eliminar proveedores:", error);
      addNotification(`Error al eliminar proveedores: ${error.message}`, "error");
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
        <h1 className="text-3xl font-bold">Proveedores</h1>
        <h2 className="text-xl text-gray-400">Departamento {departamento}</h2>
      </div>

      {/* Filtros y búsqueda */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nombre, NIF, email..."
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
      </div>

      {/* Indicador de resultados */}
      <div className="mb-4 text-sm text-gray-500">
        Mostrando {filteredProveedores.length} de {proveedores.length} proveedores
      </div>

      {/* Tabla de proveedores */}
      <div className="border border-gray-200 rounded-lg overflow-hidden mb-6 max-h-[500px] overflow-y-auto">
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="py-3 px-4 w-10">
                {filteredProveedores.length > 0 && (
                  <input
                    type="checkbox"
                    checked={
                      selectedProveedores.length === filteredProveedores.length &&
                      filteredProveedores.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="h-4 w-4 text-red-600 border-gray-300 rounded"
                  />
                )}
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Nombre</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">NIF</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Dirección</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Teléfono</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Email</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Departamento</th>
              <th className="py-3 px-4 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {filteredProveedores.length > 0 ? (
              filteredProveedores.map((proveedor) => (
                <tr
                  key={proveedor.idProveedor}
                  className={`border-t border-gray-200 cursor-pointer ${
                    selectedProveedores.includes(proveedor.idProveedor) ? "bg-red-50" : ""
                  }`}
                  onClick={() => toggleSelectProveedor(proveedor.idProveedor)}
                >
                  <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedProveedores.includes(proveedor.idProveedor)}
                      onChange={() => toggleSelectProveedor(proveedor.idProveedor)}
                      className="h-4 w-4 text-red-600 border-gray-300 rounded"
                    />
                  </td>
                  <td className="py-3 px-4">{proveedor.Nombre}</td>
                  <td className="py-3 px-4">{proveedor.NIF}</td>
                  <td className="py-3 px-4">{proveedor.Direccion}</td>
                  <td className="py-3 px-4">{proveedor.Telefono}</td>
                  <td className="py-3 px-4">{proveedor.Email}</td>
                  <td className="py-3 px-4">
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                      {proveedor.Departamento}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditModal(proveedor);
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
                <td colSpan="8" className="py-6 text-center text-gray-500">
                  No se encontraron proveedores
                  {searchTerm || filterDepartamento
                    ? " con los criterios de búsqueda actuales"
                    : ""}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-between mb-6">
        <Button onClick={handleOpenAddModal}>Nuevo Proveedor</Button>
        <Button
          onClick={handleEliminarProveedores}
          disabled={selectedProveedores.length === 0 || isLoading}
        >
          {isLoading
            ? "Procesando..."
            : `Eliminar ${
                selectedProveedores.length > 0 ? `(${selectedProveedores.length})` : ""
              }`}
        </Button>
      </div>

      {/* Modal para añadir/editar proveedor */}
      {showModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            backdropFilter: "blur(2px)",
          }}
        >
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {modalMode === "add" ? "Añadir Nuevo Proveedor" : "Editar Proveedor"}
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
                <label className="block text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={formularioProveedor.nombre}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                  placeholder="Nombre"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">NIF</label>
                <input
                  type="text"
                  name="nif"
                  value={formularioProveedor.nif}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                  placeholder="NIF"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Dirección</label>
                <input
                  type="text"
                  name="direccion"
                  value={formularioProveedor.direccion}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                  placeholder="Dirección"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  name="telefono"
                  value={formularioProveedor.telefono}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                  placeholder="Teléfono"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formularioProveedor.email}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                  placeholder="Email"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Departamento</label>
                <div className="relative">
                  <select
                    name="departamento"
                    value={formularioProveedor.departamento}
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
            </div>

            {/* Botones del formulario */}
            <div className="flex justify-end gap-4">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                onClick={handleCloseModal}
                disabled={isLoading}
              >
                Cancelar
              </button>
              <Button onClick={handleGuardarProveedor} disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}