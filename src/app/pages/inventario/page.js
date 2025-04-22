"use client"

import { ChevronDown } from "lucide-react"
import Button from "@/app/components/ui/button"

export default function Inventario() {

    return (
        <div className="p-6">
            {/* Encabezado */}
            <div className="mb-6">
            <h1 className="text-3xl font-bold">Inventario</h1>
            <h2 className="text-xl text-gray-400">Departamento</h2>
            </div>

            <div>
            {/* Formulario de añadir item */}
            <div className="rounded-lg mb-6 flex items-center gap-3">
                <input
                type="text"
                name="nombre"
                placeholder="Nombre"
                //value={nuevoItem.nombre}
                //onChange={handleInputChange}
                className="border border-gray-200 rounded px-3 py-2 w-full"
                />
                <div className="relative w-full">
                <select
                    name="departamento"
                    //value={nuevoItem.departamento}
                    //onChange={handleInputChange}
                    className="appearance-none border border-gray-200 rounded px-3 py-2 w-full pr-8 text-gray-500" 
                >
                    <option value="">Departamento</option>
                    {/* {departamentos.map((departamento) => (
                        <option key={departamento.id} value={departamento.Nombre}>
                            {departamento.Nombre}
                        </option>
                    ))} */}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                </div>
                </div>
                <div className="relative w-full max-w-[150px]">
                <input
                    type="number"
                    name="cantidad"
                    placeholder="Cantidad"
                    //value={nuevoItem.cantidad}
                    //onChange={handleInputChange}
                    className="border border-gray-200 rounded px-3 py-2 w-full"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                </div>
                </div>
                <Button>Añadir</Button>
                <Button>Editar</Button>
            </div>

            {/* Tabla de inventario */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
                <table className="w-full">
                <thead className="bg-gray-50">
                    <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Nombre</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Departamento</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Cantidad</th>
                    </tr>
                </thead>
                <tbody>
                    {/* {itemsFiltrados.map((item) => (
                    <tr key={item.id} className="border-t border-gray-200">
                        <td className="py-3 px-4">{item.nombre}</td>
                        <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                            {item.departamentos.map((dep) => (
                            <span key={dep} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                                {dep}
                            </span>
                            ))}
                        </div>
                        </td>
                        <td className="py-3 px-4 text-right">{item.cantidad}</td>
                    </tr>
                    ))} */}
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
