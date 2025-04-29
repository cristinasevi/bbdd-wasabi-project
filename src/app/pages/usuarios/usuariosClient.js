// File: src/app/pages/usuarios/usuariosClient.js
"use client"

import { useState } from "react"
import { ChevronDown, Pencil, X } from "lucide-react"
import Button from "@/app/components/ui/button"

export default function UsuariosClient({ initialUsuarios, initialRoles, initialDepartamentos }) {
    const [usuarios, setUsuarios] = useState(initialUsuarios);
    const [roles] = useState(initialRoles);
    const [departamentos] = useState(initialDepartamentos);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' o 'edit'
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [formError, setFormError] = useState("");
    const [formularioUsuario, setFormularioUsuario] = useState({
        idUsuario: null,
        nombre: "",
        apellidos: "",
        email: "",
        dni: "",
        telefono: "",
        direccion: "",
        contrasena: "",
        rol: "",
        departamento: "",
        permisos: ""
    });

    // Función para determinar los permisos según el rol
    const getPermisosPorRol = (rol) => {
        switch(rol) {
            case "Administrador":
                return "all";
            case "Contable":
                return "ver";
            case "Jefe de Departamento":
                return "ver y editar";
            default:
                return "";
        }
    }

    // Función para validar el formulario
    const validarFormulario = () => {
        if (!formularioUsuario.nombre || !formularioUsuario.apellidos || !formularioUsuario.email) {
            setFormError("Por favor, completa los campos de nombre, apellidos y email");
            return false;
        }
        if (!formularioUsuario.dni) {
            setFormError("Por favor, ingresa el DNI");
            return false;
        }
        if (!formularioUsuario.contrasena) {
            setFormError("Por favor, establece una contraseña");
            return false;
        }
        if (!formularioUsuario.rol) {
            setFormError("Por favor, selecciona un rol");
            return false;
        }
        if (formularioUsuario.rol === "Jefe de Departamento" && !formularioUsuario.departamento) {
            setFormError("Por favor, selecciona un departamento para el Jefe de Departamento");
            return false;
        }
        
        setFormError("");
        return true;
    }

    // Abrir modal de añadir usuario
    const handleOpenAddModal = () => {
        limpiarFormulario();
        setModalMode('add');
        setShowModal(true);
    };

    // Abrir modal de editar usuario
    const handleOpenEditModal = (usuario) => {
        setFormularioUsuario({
            idUsuario: usuario.idUsuario,
            nombre: usuario.Nombre || "",
            apellidos: usuario.Apellidos || "",
            email: usuario.Email || "",
            dni: usuario.DNI || "",
            telefono: usuario.Telefono || "",
            direccion: usuario.Direccion || "",
            contrasena: "", // No mostramos la contraseña existente por seguridad
            rol: usuario.Rol || "",
            departamento: usuario.Departamento || "",
            permisos: getPermisosPorRol(usuario.Rol) || ""
        });
        setModalMode('edit');
        setShowModal(true);
    };

    // Cerrar modal
    const handleCloseModal = () => {
        setShowModal(false);
        setFormError("");
    };

    // Limpiar el formulario
    const limpiarFormulario = () => {
        setFormularioUsuario({
            idUsuario: null,
            nombre: "",
            apellidos: "",
            email: "",
            dni: "",
            telefono: "",
            direccion: "",
            contrasena: "",
            rol: "",
            departamento: "",
            permisos: ""
        });
        setFormError("");
    };

    // Manejar cambios en el formulario
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // Si cambia el rol, actualizar los permisos y departamento automáticamente
        if (name === "rol") {
            let nuevosPermisos = "";
            let nuevoDepartamento = formularioUsuario.departamento;
            
            if (value === "Administrador") {
                nuevosPermisos = "all";
                nuevoDepartamento = "Admin";
            } else if (value === "Contable") {
                nuevosPermisos = "ver";
                nuevoDepartamento = "Contable";
            } else if (value === "Jefe de Departamento") {
                nuevosPermisos = "ver y editar";
                // El departamento debe seleccionarlo el usuario
                nuevoDepartamento = "";
            }
            
            setFormularioUsuario({
                ...formularioUsuario,
                [name]: value,
                permisos: nuevosPermisos,
                departamento: nuevoDepartamento
            });
            return;
        }
        
        setFormularioUsuario({
            ...formularioUsuario,
            [name]: value
        });
    };

    // Toggle selección de usuario
    const toggleSelectUser = (userId) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        } else {
            setSelectedUsers([...selectedUsers, userId]);
        }
    };

    // Manejar añadir o editar usuario
    const handleGuardarUsuario = async () => {
        if (!validarFormulario()) return;
        
        setIsLoading(true);
        
        try {
            let url = '/api/usuarios';
            let method = 'POST';
            let successMessage = 'Usuario creado correctamente';
            
            if (modalMode === 'edit') {
                url = `/api/usuarios/${formularioUsuario.idUsuario}`;
                method = 'PUT';
                successMessage = 'Usuario actualizado correctamente';
            }
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    DNI: formularioUsuario.dni,
                    Nombre: formularioUsuario.nombre,
                    Apellidos: formularioUsuario.apellidos,
                    Telefono: formularioUsuario.telefono,
                    Direccion: formularioUsuario.direccion,
                    Contrasena: formularioUsuario.contrasena,
                    Email: formularioUsuario.email,
                    id_RolFK: roles.find(r => r.Tipo === formularioUsuario.rol)?.idRol
                }),
            });
            
            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (modalMode === 'add') {
                // Añadir el nuevo usuario a la lista local
                const nuevoUsuario = {
                    idUsuario: data.id,
                    Nombre: formularioUsuario.nombre,
                    Apellidos: formularioUsuario.apellidos,
                    DNI: formularioUsuario.dni,
                    Telefono: formularioUsuario.telefono,
                    Direccion: formularioUsuario.direccion,
                    Email: formularioUsuario.email,
                    Rol: formularioUsuario.rol,
                    Departamento: formularioUsuario.departamento,
                    Permisos: formularioUsuario.permisos
                };
                
                setUsuarios([...usuarios, nuevoUsuario]);
            } else {
                // Actualizar el usuario existente en la lista local
                setUsuarios(usuarios.map(u => 
                    u.idUsuario === formularioUsuario.idUsuario 
                        ? {
                            ...u,
                            Nombre: formularioUsuario.nombre,
                            Apellidos: formularioUsuario.apellidos,
                            DNI: formularioUsuario.dni,
                            Telefono: formularioUsuario.telefono,
                            Direccion: formularioUsuario.direccion,
                            Email: formularioUsuario.email,
                            Rol: formularioUsuario.rol,
                            Departamento: formularioUsuario.departamento,
                            Permisos: formularioUsuario.permisos
                        } 
                        : u
                ));
            }
            // Mostrar mensaje de éxito y actualizar UI
            alert(successMessage);
            setShowModal(false);
            limpiarFormulario();
            
            // En caso de crear un nuevo usuario, podemos recargar los datos
            if (modalMode === 'add') {
                // Opcional: Recargar todos los usuarios de la base de datos para asegurar datos frescos
                try {
                    const refreshResponse = await fetch('/api/usuarios');
                    if (refreshResponse.ok) {
                        const refreshedUsers = await refreshResponse.json();
                        setUsuarios(refreshedUsers);
                    }
                } catch (refreshError) {
                    console.warn("No se pudieron actualizar los datos:", refreshError);
                    // No bloqueamos el flujo por este error
                }
            }
            
        } catch (error) {
            console.error('Error:', error);
            setFormError(`Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Manejar eliminar usuarios
    const handleEliminarUsuarios = async () => {
        if (selectedUsers.length === 0) {
            alert("Por favor, selecciona al menos un usuario para eliminar");
            return;
        }
        
        if (!confirm(`¿Estás seguro de que deseas eliminar ${selectedUsers.length} usuario(s)?`)) {
            return;
        }
        
        setIsLoading(true);
        
        try {
            const response = await fetch('/api/usuarios', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ids: selectedUsers }),
            });
            
            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.status}`);
            }
            
            // Actualizar la lista local
            setUsuarios(usuarios.filter(u => !selectedUsers.includes(u.idUsuario)));
            setSelectedUsers([]);
            
            alert('Usuarios eliminados correctamente');
            
        } catch (error) {
            console.error('Error:', error);
            alert(`Error al eliminar usuarios: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6">
            {/* Encabezado */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
            </div>

            {/* Botones de acción superiores */}
            <div className="flex justify-between mb-6">
                <Button onClick={handleOpenAddModal}>
                    Nuevo Usuario
                </Button>
                <Button onClick={handleEliminarUsuarios} disabled={selectedUsers.length === 0 || isLoading}>
                    {isLoading ? "Procesando..." : `Eliminar ${selectedUsers.length > 0 ? `(${selectedUsers.length})` : ""}`}
                </Button>
            </div>

            {/* Tabla de usuarios */}
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-6 max-h-[650px] overflow-y-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                        <th className="py-3 px-4 w-10"></th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Usuario</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">DNI</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Rol</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Correo</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Departamento</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Permisos</th>
                        <th className="py-3 px-4 w-10"></th>
                    </tr>
                    </thead>
                    <tbody>
                    {usuarios.map((usuario) => {
                        // Determinar permisos basados en el rol
                        const permisosBasadosEnRol = getPermisosPorRol(usuario.Rol);
                        
                        return (
                            <tr key={usuario.idUsuario} className="border-t border-gray-200 hover:bg-gray-50">
                                <td className="py-3 px-4 text-center">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedUsers.includes(usuario.idUsuario)}
                                        onChange={() => toggleSelectUser(usuario.idUsuario)}
                                        className="h-4 w-4 text-red-600 border-gray-300 rounded"
                                    />
                                </td>
                                <td className="py-3 px-4">{usuario.Nombre} {usuario.Apellidos}</td>
                                <td className="py-3 px-4">{usuario.DNI || "-"}</td>
                                <td className="py-3 px-4">{usuario.Rol}</td>
                                <td className="py-3 px-4">{usuario.Email}</td>
                                <td className="py-3 px-4">
                                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                                        {usuario.Departamento || "No asignado"}
                                    </span>
                                </td>
                                <td className="py-3 px-4">
                                    <div className="w-40">
                                        <div className="bg-gray-100 border border-gray-200 rounded px-3 py-1">
                                            {permisosBasadosEnRol}
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-center">
                                    <button 
                                        onClick={() => handleOpenEditModal(usuario)} 
                                        className="text-gray-500 hover:text-red-600"
                                    >
                                        <Pencil className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            {/* Modal para añadir/editar usuario */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">
                                {modalMode === 'add' ? 'Añadir Nuevo Usuario' : 'Editar Usuario'}
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
                                    value={formularioUsuario.nombre}
                                    onChange={handleInputChange}
                                    className="border border-gray-200 rounded px-3 py-2 w-full"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-1">Apellidos</label>
                                <input
                                    type="text"
                                    name="apellidos"
                                    value={formularioUsuario.apellidos}
                                    onChange={handleInputChange}
                                    className="border border-gray-200 rounded px-3 py-2 w-full"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-1">DNI</label>
                                <input
                                    type="text"
                                    name="dni"
                                    value={formularioUsuario.dni}
                                    onChange={handleInputChange}
                                    className="border border-gray-200 rounded px-3 py-2 w-full"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formularioUsuario.email}
                                    onChange={handleInputChange}
                                    className="border border-gray-200 rounded px-3 py-2 w-full"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-1">Teléfono</label>
                                <input
                                    type="tel"
                                    name="telefono"
                                    value={formularioUsuario.telefono}
                                    onChange={handleInputChange}
                                    className="border border-gray-200 rounded px-3 py-2 w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-1">Dirección</label>
                                <input
                                    type="text"
                                    name="direccion"
                                    value={formularioUsuario.direccion}
                                    onChange={handleInputChange}
                                    className="border border-gray-200 rounded px-3 py-2 w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-1">Contraseña {modalMode === 'edit' && "(Dejar vacío para mantener)"}</label>
                                <input
                                    type="password"
                                    name="contrasena"
                                    value={formularioUsuario.contrasena}
                                    onChange={handleInputChange}
                                    className="border border-gray-200 rounded px-3 py-2 w-full"
                                    required={modalMode === 'add'}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-1">Rol</label>
                                <div className="relative">
                                    <select
                                        name="rol"
                                        value={formularioUsuario.rol}
                                        onChange={handleInputChange}
                                        className="appearance-none border border-gray-200 rounded px-3 py-2 w-full pr-8"
                                        required
                                    >
                                        <option value="">Seleccionar rol</option>
                                        {roles.map((rol) => (
                                            <option key={rol.idRol} value={rol.Tipo}>
                                                {rol.Tipo}
                                            </option>
                                        ))}
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
                                        value={formularioUsuario.departamento}
                                        onChange={handleInputChange}
                                        className="appearance-none border border-gray-200 rounded px-3 py-2 w-full pr-8"
                                        disabled={formularioUsuario.rol === "Administrador" || formularioUsuario.rol === "Contable"}
                                        required={formularioUsuario.rol === "Jefe de Departamento"}
                                    >
                                        <option value="">Seleccionar departamento</option>
                                        {formularioUsuario.rol === "Administrador" && (
                                            <option value="Admin">Admin</option>
                                        )}
                                        {formularioUsuario.rol === "Contable" && (
                                            <option value="Contable">Contable</option>
                                        )}
                                        {formularioUsuario.rol !== "Administrador" && formularioUsuario.rol !== "Contable" && (
                                            departamentos.map((departamento) => (
                                                <option key={departamento.id_Departamento} value={departamento.Nombre}>
                                                    {departamento.Nombre}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                        <ChevronDown className="w-4 h-4 text-gray-500" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-1">Permisos</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formularioUsuario.permisos}
                                        className="border border-gray-200 rounded px-3 py-2 w-full bg-gray-50"
                                        disabled
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={handleCloseModal}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                            >
                                Cancelar
                            </button>
                            <Button 
                                onClick={handleGuardarUsuario} 
                                disabled={isLoading}
                            >
                                {isLoading ? "Procesando..." : "Guardar"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}