"use client"

import { useState, useMemo } from "react"
import { ChevronDown, Pencil, X, Search, Filter } from "lucide-react"
import Button from "@/app/components/ui/button"
import useNotifications from "@/app/hooks/useNotifications"
import ConfirmationDialog from "@/app/components/ui/confirmation-dialog"
import useUserDepartamento from "@/app/hooks/useUserDepartamento";

export default function OrdenesCompraClient({
  initialOrdenes,
  initialDepartamentos,
  initialProveedores,
}) {

  // Agregamos el hook para obtener el departamento del usuario
  const { departamento, isLoading: isDepartamentoLoading } = useUserDepartamento();

  // Mapeo de departamentos
  const departamentoMapping = {
    'INFO': 'Informática',
    'MARK': 'Marketing',
    'RRHH': 'Recursos Humanos',
    'CONT': 'Contabilidad',
    'OPER': 'Operaciones',
    'MEC': 'Mecánica',
    'ELE': 'Electricidad',
    'AUT': 'Automoción',
    'ROB': 'Robótica',
    'INF': 'Informática'
  }

  // Normalizar departamentos
  const normalizarDepartamento = (dept) => {
    if (!dept) return dept
    // Si ya está en formato normal, devolver
    if (Object.values(departamentoMapping).includes(dept)) {
      return dept
    }
    // Si es un código, mapear al nombre completo
    return departamentoMapping[dept] || dept
  }

  // Estados principales
  const [ordenes, setOrdenes] = useState(() => 
    initialOrdenes.map(orden => ({
      ...orden,
      Departamento: normalizarDepartamento(orden.Departamento)
    }))
  )
  
  // Obtener todos los departamentos únicos de las órdenes
  const departamentosUnicos = useMemo(() => {
    const depts = new Set()
    ordenes.forEach(orden => {
      if (orden.Departamento) {
        depts.add(orden.Departamento)
      }
    })
    return Array.from(depts).sort()
  }, [ordenes])
  const [departamentos] = useState(initialDepartamentos)
  const [proveedores] = useState(initialProveedores)
  const [selectedOrdenes, setSelectedOrdenes] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState("add") // 'add' o 'edit'
  const [formError, setFormError] = useState("")

  // Estados para búsqueda y filtrado
  const [searchTerm, setSearchTerm] = useState("")
  const [filterDepartamento, setFilterDepartamento] = useState("")
  const [filterProveedor, setFilterProveedor] = useState("")
  const [filterInventariable, setFilterInventariable] = useState("")

  // Estado para diálogo de confirmación
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  })

  // Hook de notificaciones
  const { addNotification, notificationComponents } = useNotifications()

  // Estado del formulario
  const [formularioOrden, setFormularioOrden] = useState({
    idOrden: null,
    numero: "",
    numInversion: "",
    importe: "",
    fecha: "",
    descripcion: "",
    inventariable: "",
    cantidad: "",
    departamento: "",
    proveedor: "",
  })

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

  // Función para formatear inventariable
  function formatInventariable(value) {
    if (value === 1 || value === "1" || value === true) return "Sí"
    if (value === 0 || value === "0" || value === false) return "No"
    return value || "-" 
  }

  // Obtener proveedores filtrados por departamento
  const proveedoresFiltrados = useMemo(() => {
    if (!filterDepartamento) return proveedores
    
    return proveedores.filter(proveedor => {
      return initialOrdenes.some(orden => 
        orden.Proveedor === proveedor.Nombre && orden.Departamento === filterDepartamento
      )
    })
  }, [filterDepartamento, proveedores, initialOrdenes])

  // Reset proveedor cuando cambia departamento
  useMemo(() => {
    setFilterProveedor("")
  }, [filterDepartamento])

  // Filtrar órdenes según los criterios de búsqueda y filtrado
  const filteredOrdenes = useMemo(() => {
    return ordenes.filter((orden) => {
      // Filtro por término de búsqueda (número, descripción)
      const matchesSearch =
        searchTerm === "" ||
        orden.Num_orden?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        orden.Descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        orden.Num_inversion?.toLowerCase().includes(searchTerm.toLowerCase())

      // Filtro por departamento
      const matchesDepartamento = filterDepartamento === "" || 
        orden.Departamento === filterDepartamento

      // Filtro por proveedor
      const matchesProveedor = filterProveedor === "" || 
        orden.Proveedor === filterProveedor

      // Filtro por inventariable
      const matchesInventariable = filterInventariable === "" || 
        (filterInventariable === "inventariable" && orden.Inventariable === 1) ||
        (filterInventariable === "no-inventariable" && orden.Inventariable === 0)

      return matchesSearch && matchesDepartamento && matchesProveedor && matchesInventariable
    })
  }, [ordenes, searchTerm, filterDepartamento, filterProveedor, filterInventariable])

  // Toggle selección de orden
  const toggleSelectOrden = (ordenId) => {
    if (selectedOrdenes.includes(ordenId)) {
      setSelectedOrdenes(selectedOrdenes.filter((id) => id !== ordenId))
    } else {
      setSelectedOrdenes([...selectedOrdenes, ordenId])
    }
  }

  // Función para seleccionar/deseleccionar todas las órdenes mostradas
  const toggleSelectAll = () => {
    if (selectedOrdenes.length === filteredOrdenes.length) {
      setSelectedOrdenes([])
    } else {
      setSelectedOrdenes(filteredOrdenes.map((o) => o.idOrden))
    }
  }

  // Abrir modal de añadir orden
  const handleOpenAddModal = () => {
    limpiarFormulario()
    setModalMode("add")
    setShowModal(true)
  }

  // Abrir modal de editar orden
  const handleOpenEditModal = (orden) => {
    setFormularioOrden({
      idOrden: orden.idOrden,
      numero: orden.Num_orden || "",
      numInversion: orden.Num_inversion || "",
      importe: orden.Importe || "",
      fecha: formatDateForInput(orden.Fecha) || "",
      descripcion: orden.Descripcion || "",
      inventariable: orden.Inventariable || "",
      cantidad: orden.Cantidad || "",
      departamento: orden.Departamento || "",
      proveedor: orden.Proveedor || "",
    })
    setModalMode("edit")
    setShowModal(true)
  }

  // Formatear fecha para input
  function formatDateForInput(dateString) {
    if (!dateString) return ""
    if (dateString instanceof Date) {
      return dateString.toISOString().split('T')[0]
    }
    try {
      const date = new Date(dateString)
      return date.toISOString().split('T')[0]
    } catch (error) {
      return dateString
    }
  }

  // Cerrar modal
  const handleCloseModal = () => {
    setShowModal(false)
    setFormError("")
  }

  // Limpiar el formulario
  const limpiarFormulario = () => {
    setFormularioOrden({
      idOrden: null,
      numero: "",
      numInversion: "",
      importe: "",
      fecha: "",
      descripcion: "",
      inventariable: "",
      cantidad: "",
      departamento: "",
      proveedor: "",
    })
    setFormError("")
  }

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormularioOrden({
      ...formularioOrden,
      [name]: value,
    })
  }

  // Validar formulario
  const validarFormulario = () => {
    if (!formularioOrden.numero) {
      setFormError("Por favor, ingresa el número de orden")
      return false
    }
    if (!formularioOrden.importe) {
      setFormError("Por favor, ingresa el importe")
      return false
    }
    if (!formularioOrden.fecha) {
      setFormError("Por favor, ingresa la fecha")
      return false
    }
    if (!formularioOrden.descripcion) {
      setFormError("Por favor, ingresa la descripción")
      return false
    }
    if (!formularioOrden.cantidad) {
      setFormError("Por favor, ingresa la cantidad")
      return false
    }
    if (!formularioOrden.inventariable) {
      setFormError("Por favor, selecciona si es inventariable")
      return false
    }
    if (!formularioOrden.departamento) {
      setFormError("Por favor, selecciona un departamento")
      return false
    }
    if (!formularioOrden.proveedor) {
      setFormError("Por favor, selecciona un proveedor")
      return false
    }

    setFormError("")
    return true
  }

  // Guardar orden
  const handleGuardarOrden = async () => {
    if (!validarFormulario()) return

    setIsLoading(true)

    try {
      let response
      if (modalMode === "add") {
        // Lógica para añadir nueva orden
        response = await fetch("/api/getOrden", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            Num_orden: formularioOrden.numero,
            Importe: parseFloat(formularioOrden.importe),
            Fecha: formularioOrden.fecha,
            Descripcion: formularioOrden.descripcion,
            Inventariable: formularioOrden.inventariable === "Sí" ? 1 : 0,
            Cantidad: parseInt(formularioOrden.cantidad),
            id_DepartamentoFK: 1, // Esto debería obtenerlo de alguna manera
            id_ProveedorFK: proveedores.find(p => p.Nombre === formularioOrden.proveedor)?.idProveedor,
            id_UsuarioFK: 1, // Aquí deberías obtener el usuario actual
            Num_inversion: formularioOrden.numInversion,
          }),
        })
      } else {
        // Lógica para editar orden existente
        console.log("Edición no implementada aún")
      }

      if (response?.ok) {
        const data = await response.json()
        
        // Actualizar lista de órdenes con normalización de departamentos
        const updatedOrdenes = await fetch("/api/getOrden").then(res => res.json())
        setOrdenes(updatedOrdenes.map(orden => ({
          ...orden,
          Departamento: normalizarDepartamento(orden.Departamento)
        })))

        addNotification(
          modalMode === "add" ? "Orden creada correctamente" : "Orden actualizada correctamente",
          "success"
        )

        handleCloseModal()
      }
    } catch (error) {
      console.error("Error al guardar la orden:", error)
      addNotification(`Error al guardar la orden: ${error.message}`, "error")
    } finally {
      setIsLoading(false)
    }
  }

  // Eliminar órdenes seleccionadas
  const handleEliminarOrdenes = () => {
    if (selectedOrdenes.length === 0) {
      addNotification("Por favor, selecciona al menos una orden para eliminar", "warning")
      return
    }

    setConfirmDialog({
      isOpen: true,
      title: "Confirmar eliminación",
      message: `¿Estás seguro de que deseas eliminar ${selectedOrdenes.length} orden(es)? Esta acción no se puede deshacer.`,
      onConfirm: confirmDeleteOrdenes,
    })
  }

  // Confirmar eliminación de órdenes
  const confirmDeleteOrdenes = async () => {
    setIsLoading(true)

    try {
      // Aquí necesitarás implementar la API para eliminar órdenes
      // Por ahora solo actualizamos la UI localmente
      setOrdenes(ordenes.filter((o) => !selectedOrdenes.includes(o.idOrden)))
      setSelectedOrdenes([])
      addNotification(`${selectedOrdenes.length} orden(es) eliminadas correctamente`, "success")
    } catch (error) {
      console.error("Error al eliminar órdenes:", error)
      addNotification(`Error al eliminar órdenes: ${error.message}`, "error")
    } finally {
      setIsLoading(false)
    }
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
          >
            <option value="">Todos los departamentos</option>
            {departamentosUnicos.map((departamento, index) => (
              <option key={`${departamento}-${index}`} value={departamento}>
                {departamento}
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
        Mostrando {filteredOrdenes.length} de {ordenes.length} órdenes
      </div>

      {/* Tabla de órdenes */}
      <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
        <div className="max-h-[450px] overflow-y-auto">
          <table className="w-full table-fixed">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr className="border-b border-gray-200">
                <th className="py-3 px-4 w-10">
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
                <th className="text-left py-3 px-4 font-medium text-gray-600 w-32">Num Orden</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 w-32">Num Inversión</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 w-24">Importe</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 w-28">Fecha</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Descripción</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 w-28">Inventariable</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 w-20">Cantidad</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 w-36">Departamento</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 w-32">Proveedor</th>
                <th className="py-3 px-4 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filteredOrdenes.length > 0 ? (
                filteredOrdenes.map((orden) => (
                  <tr
                    key={orden.idOrden}
                    className={`border-t border-gray-200 cursor-pointer ${
                      selectedOrdenes.includes(orden.idOrden) ? "bg-red-50" : ""
                    }`}
                    onClick={() => toggleSelectOrden(orden.idOrden)}
                  >
                    <td className="py-3 px-4 text-center w-10" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedOrdenes.includes(orden.idOrden)}
                        onChange={() => toggleSelectOrden(orden.idOrden)}
                        className="h-4 w-4 text-red-600 border-gray-300 rounded"
                      />
                    </td>
                    <td className="py-3 px-4 w-32">{orden.Num_orden}</td>
                    <td className="py-3 px-4 w-32">{orden.Num_inversion || "-"}</td>
                    <td className="py-3 px-4 w-24">{orden.Importe}€</td>
                    <td className="py-3 px-4 w-28">{formatDate(orden.Fecha)}</td>
                    <td className="py-3 px-4 truncate" title={orden.Descripcion}>{orden.Descripcion}</td>
                    <td className="py-3 px-4 w-28">{formatInventariable(orden.Inventariable)}</td>
                    <td className="py-3 px-4 w-20">{orden.Cantidad}</td>
                    <td className="py-3 px-4 w-36">
                      <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                        {orden.Departamento}
                      </span>
                    </td>
                    <td className="py-3 px-4 w-32">{orden.Proveedor}</td>
                    <td className="py-3 px-4 text-center w-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenEditModal(orden)
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
                  <td colSpan="11" className="py-6 text-center text-gray-500">
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

      {/* Botones de acción */}
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
              <div>
                <label className="block text-gray-700 mb-1">Número</label>
                <input
                  type="text"
                  name="numero"
                  value={formularioOrden.numero}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                  placeholder="Número"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Num Inversión</label>
                <input
                  type="text"
                  name="numInversion"
                  value={formularioOrden.numInversion}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                  placeholder="Num Inversión"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Importe</label>
                <input
                  type="text"
                  name="importe"
                  value={formularioOrden.importe}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                  placeholder="Importe"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Fecha</label>
                <input
                  type="date"
                  name="fecha"
                  value={formularioOrden.fecha}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded px-3 py-2 w-full text-gray-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Descripción</label>
                <input
                  type="text"
                  name="descripcion"
                  value={formularioOrden.descripcion}
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
                  value={formularioOrden.cantidad}
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
                    value={formularioOrden.inventariable}
                    onChange={handleInputChange}
                    className="appearance-none border border-gray-300 rounded px-3 py-2 w-full pr-8 text-gray-500"
                  >
                    <option value="">Seleccionar</option>
                    <option value="Sí">Inventariable</option>
                    <option value="No">No Inventariable</option>
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
                    value={formularioOrden.departamento}
                    onChange={handleInputChange}
                    className="appearance-none border border-gray-300 rounded px-3 py-2 w-full pr-8 text-gray-500"
                  >
                    <option value="">Seleccionar departamento</option>
                    {departamentosUnicos.map((departamento, index) => (
                      <option key={`form-${departamento}-${index}`} value={departamento}>
                        {departamento}
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
                    value={formularioOrden.proveedor}
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
            <div className="flex justify-end gap-4">
              <Button
                variant="secondary"
                onClick={handleCloseModal}
                disabled={isLoading}
              >
                Cancelar
              </Button>
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
  )
}