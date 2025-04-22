import { getUsuariosConPermisos } from "@/app/api/functions/usuarios"
import { ChevronDown } from "lucide-react"
import Button from "@/app/components/ui/button";

export default async function Usuarios() {
    const usuarios = await getUsuariosConPermisos()

    return (
        <div className="p-6">
            {/* Encabezado */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
            </div>

            {/* Formulario de añadir usuario */}
            <div className=" rounded-lg mb-6 flex items-center gap-3">
                <input
                type="text"
                name="usuario"
                placeholder="Usuario"
                //value={nuevoUsuario.usuario}
                //onChange={handleInputChange}
                className="border border-gray-200 rounded px-3 py-2 w-full max-w-[200px]"
                />
                <input
                type="text"
                name="rol"
                placeholder="Rol"
                //value={nuevoUsuario.rol}
                //onChange={handleInputChange}
                className="border border-gray-200 rounded px-3 py-2 w-full max-w-[200px]"
                />
                <input
                type="email"
                name="correo"
                placeholder="Correo"
                //value={nuevoUsuario.correo}
                //onChange={handleInputChange}
                className="border border-gray-200 rounded px-3 py-2 w-full"
                />
                <div className="relative w-full max-w-[200px]">
                <select
                    name="permisos"
                    //value={nuevoUsuario.permisos}
                    //onChange={handleInputChange}
                    className="appearance-none border border-gray-200 rounded px-3 py-2 w-full pr-8"
                >
                    <option value="all">all</option>
                    <option value="ver y editar">ver y editar</option>
                    <option value="ver">ver</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                </div>
                </div>
                <Button>Añadir</Button>
                <Button>Editar</Button>
            </div>
            {/* Tabla de usuarios */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Usuario</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Rol</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Correo</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Permisos</th>
                    </tr>
                    </thead>
                    <tbody>
                    {usuarios.map((usuario) => (
                        <tr key={usuario.idUsuario} className="border-t border-gray-200">
                        <td className="py-3 px-4">{usuario.Nombre} {usuario.Apellidos}</td>
                        <td className="py-3 px-4">{usuario.Rol}</td>
                        <td className="py-3 px-4">{usuario.Email}</td>
                        <td className="py-3 px-4">
                            <div className="relative w-40">
                            <select
                                defaultValue={usuario.Permisos}
                                //onChange={(e) => handlePermisosChange(usuario.id, e.target.value)}
                                className="appearance-none bg-gray-100 border border-gray-200 rounded px-3 py-1 w-full pr-8"
                            >
                                <option value="all">all</option>
                                <option value="ver y editar">ver y editar</option>
                                <option value="ver">ver</option>
                            </select>
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                            </div>
                            </div>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end mt-6 gap-3">
                <Button>Eliminar</Button>
                <Button>Guardar</Button>
            </div>
        </div>
    );
}
