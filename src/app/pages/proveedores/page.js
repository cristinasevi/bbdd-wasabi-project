import { getDepartamentos } from "@/app/api/functions/departamentos"
import { getProveedores } from "@/app/api/functions/proveedores"
import { ChevronDown } from "lucide-react"
import Button from "@/app/components/ui/button"

export default async function Proveedores() {
    const departamentos = await getDepartamentos()
    const proveedores = await getProveedores()

    return (
        <div className="p-6">
            {/* Encabezado */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Proveedores</h1>
                <h2 className="text-xl text-gray-400">Departamento </h2>
            </div>

            <div>
                {/* Formulario de añadir/editar proveedor */}
                <div className="rounded-lg mb-6 flex flex-wrap items-center gap-3 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        type="text"
                        name="nombre"
                        placeholder="Nombre"
                        className="border border-gray-200 rounded px-3 py-2 w-full sm:w-auto flex-grow"
                    />
                    <input
                        type="text"
                        name="nif"
                        placeholder="NIF"
                        className="border border-gray-200 rounded px-3 py-2 w-full sm:w-auto"
                    />
                    <input
                        type="text"
                        name="direccion"
                        placeholder="Dirección"
                        className="border border-gray-200 rounded px-3 py-2 w-full sm:w-auto flex-grow"
                    />
                    <input
                        type="tel"
                        name="telefono"
                        placeholder="Teléfono"
                        className="border border-gray-200 rounded px-3 py-2 w-full sm:w-auto"
                    />
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        className="border border-gray-200 rounded px-3 py-2 w-full sm:w-auto flex-grow"
                    />
                    <div className="relative w-full sm:w-auto">
                        <select
                        name="departamento"
                        className="appearance-none border border-gray-200 rounded px-3 py-2 w-full pr-8 text-gray-500"
                        >
                            <option value="">Departamento</option>
                            {departamentos.map((departamento) => {
                                const id = departamento.id || departamento.id_Departamento;
                                const nombre = departamento.Nombre;
                                return (
                                <option key={id} value={id}>
                                    {nombre}
                                </option>
                                );
                            })}
                        </select>
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                        </div>
                    </div>
                </div>
                {/* Botones de acción */}
                <div className="flex justify-end mb-6 gap-2">
                    <Button>Añadir</Button>
                    <Button>Editar</Button>
                </div>

                {/* Tabla de proveedores */}
                <div className="border border-gray-200 rounded-lg overflow-hidden mb-6 max-h-[500px] overflow-y-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="text-left py-3 px-4 font-medium text-gray-600">Nombre</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-600">NIF</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-600">Dirección</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-600">Teléfono</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-600">Email</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-600">Departamento</th>
                            </tr>
                        </thead>
                        <tbody>
                            {proveedores.map((proveedor) => (
                                <tr key={proveedor.idProveedor} className="border-t border-gray-200">
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
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Botones de acción */}
                <div className="flex justify-end gap-3">
                    <Button>Eliminar</Button>
                    <Button>Guardar</Button>
                </div>
            </div>
        </div>
    )
}
