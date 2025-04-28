"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import Button from "@/app/components/ui/button"

export default function UsuariosClient({ initialUsuarios, initialRoles, initialDepartamentos }) {
    const [usuarios, setUsuarios] = useState(initialUsuarios);
    const [roles] = useState(initialRoles);
    const [departamentos] = useState(initialDepartamentos);
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [formError, setFormError] = useState("");
    const [formularioUsuario, setFormularioUsuario] = useState({
        nombre: "",
        apellidos: "",
        email: "",
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
        if (!formularioUsuario.rol) {
            setFormError("Por favor, selecciona un rol");
            return false;
        }
        if (!formularioUsuario.departamento) {
            setFormError("Por favor, selecciona un departamento");
            return false;
        }
        
        setFormError("");
        return true;
    }

    // Manejar cuando se selecciona un usuario
    const handleSeleccionarUsuario = (usuario) => {
        // Si ya está seleccionado, lo deseleccionamos
        if (usuarioSeleccionado === usuario.idUsuario) {
            setUsuarioSeleccionado(null);
            limpiarFormulario();
            return;
        }
        
        setUsuarioSeleccionado(usuario.idUsuario);
        setFormularioUsuario({
            nombre: usuario.Nombre || "",
            apellidos: usuario.Apellidos || "",
            email: usuario.Email || "",
            rol: usuario.Rol || "",
            departamento: usuario.Departamento || "",
            permisos: getPermisosPorRol(usuario.Rol) || ""
        });
    };

    // Limpiar el formulario
    const limpiarFormulario = () => {
        setFormularioUsuario({
            nombre: "",
            apellidos: "",
            email: "",
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
            let nuevoDepartamento = "";
            
            if (value === "Administrador") {
                nuevosPermisos = "all";
                nuevoDepartamento = "Admin";
            } else if (value === "Contable") {
                nuevosPermisos = "ver";
                nuevoDepartamento = "Contable";
            } else if (value === "Jefe de Departamento") {
                nuevosPermisos = "ver y editar";
                // No cambiamos el departamento para jefes, deben seleccionarlo
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

    // Manejar añadir nuevo usuario
    // En la función handleAñadirUsuario del componente cliente
    const handleAñadirUsuario = async () => {
        if (!validarFormulario()) return;
        
        setIsLoading(true);
        
        try {
            console.log("Enviando datos:", formularioUsuario);
            
            const response = await fetch('/api/usuarios/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formularioUsuario),
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Error response:", errorText);
                throw new Error(`Error del servidor: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Añadir el nuevo usuario a la lista local con ID generado
            const nuevoUsuario = {
                idUsuario: data.id,
                Nombre: formularioUsuario.nombre,
                Apellidos: formularioUsuario.apellidos,
                Email: formularioUsuario.email,
                Rol: formularioUsuario.rol,
                Departamento: formularioUsuario.departamento,
                Permisos: formularioUsuario.permisos
            };
            
            setUsuarios([...usuarios, nuevoUsuario]);
            limpiarFormulario();
            
            alert('Usuario creado correctamente');
        } catch (error) {
            console.error('Error:', error);
            setFormError(`Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Manejar guardar cambios
    const handleGuardar = () => {
        if (usuarioSeleccionado) {
            // Actualizar usuario existente
            // Aquí iría la implementación para actualizar un usuario existente
            alert("Funcionalidad de actualización pendiente de implementar");
            setUsuarioSeleccionado(null);
            limpiarFormulario();
        } else {
            // Añadir nuevo usuario
            handleAñadirUsuario();
        }
    };

    return (
        <div className="p-6">
            {/* Encabezado */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
            </div>

            {/* Mensaje de error del formulario */}
            {formError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {formError}
                </div>
            )}

            {/* Formulario de añadir/editar usuario */}
            <div className="rounded-lg mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                    type="text"
                    name="nombre"
                    placeholder="Nombre"
                    value={formularioUsuario.nombre}
                    onChange={handleInputChange}
                    className="border border-gray-200 rounded px-3 py-2 w-full"
                />
                <input
                    type="text"
                    name="apellidos"
                    placeholder="Apellidos"
                    value={formularioUsuario.apellidos}
                    onChange={handleInputChange}
                    className="border border-gray-200 rounded px-3 py-2 w-full"
                />
                <input
                    type="email"
                    name="email"
                    placeholder="Correo"
                    value={formularioUsuario.email}
                    onChange={handleInputChange}
                    className="border border-gray-200 rounded px-3 py-2 w-full"
                />
                <div className="relative w-full">
                    <select
                        name="rol"
                        value={formularioUsuario.rol}
                        onChange={handleInputChange}
                        className="appearance-none border border-gray-200 rounded px-3 py-2 w-full pr-8 text-gray-500"
                    >
                        <option value="">Rol</option>
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
                <div className="relative w-full">
                    <select
                        name="departamento"
                        value={formularioUsuario.departamento}
                        onChange={handleInputChange}
                        className="appearance-none border border-gray-200 rounded px-3 py-2 w-full pr-8 text-gray-500"
                    >
                        <option value="">Departamento</option>
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
                <div className="relative w-full">
                    <select
                        name="permisos"
                        value={formularioUsuario.permisos}
                        onChange={handleInputChange}
                        className="appearance-none border border-gray-200 rounded px-3 py-2 w-full pr-8 text-gray-500"
                        disabled={true} // Siempre deshabilitado, determinado por rol
                    >
                        <option value="">Permisos</option>
                        <option value="all">all</option>
                        <option value="ver y editar">ver y editar</option>
                        <option value="ver">ver</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                    </div>
                </div>
            </div>
            
            {/* Botón de acción para el formulario */}
            <div className="flex justify-end mb-6 gap-2">
                <Button onClick={handleGuardar} disabled={isLoading}>
                    {isLoading ? "Procesando..." : (usuarioSeleccionado ? "Guardar" : "Añadir")}
                </Button>
            </div>

            {/* Tabla de usuarios */}
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-6 max-h-[500px] overflow-y-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                        <th className="py-3 px-4 w-10"></th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Usuario</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Rol</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Correo</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Departamento</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Permisos</th>
                    </tr>
                    </thead>
                    <tbody>
                    {usuarios.map((usuario) => {
                        // Determinar permisos basados en el rol
                        const permisosBasadosEnRol = getPermisosPorRol(usuario.Rol);
                        
                        return (
                            <tr key={usuario.idUsuario} className="border-t border-gray-200">
                                <td className="py-3 px-4 text-center">
                                    <div 
                                        onClick={() => handleSeleccionarUsuario(usuario)}
                                        className="cursor-pointer"
                                    >
                                        <input 
                                            type="radio" 
                                            checked={usuarioSeleccionado === usuario.idUsuario}
                                            onChange={() => {}} // Controlado por onClick en el div padre
                                            className="h-4 w-4 text-red-600 border-gray-300"
                                            name="usuario-seleccionado"
                                        />
                                    </div>
                                </td>
                                <td className="py-3 px-4">{usuario.Nombre} {usuario.Apellidos}</td>
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
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            {/* Botón de acción */}
            <div className="flex justify-end mt-6 gap-3">
                <Button>Eliminar</Button>
            </div>
        </div>
    );
}