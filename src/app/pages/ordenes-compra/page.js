import Button from "@/app/components/ui/button"

export default function OrdenesCompraPage() {
  return (
    <div className="p-6">
      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Orden de Compra</h1>
        <h2 className="text-xl text-gray-400">Departamento </h2>
      </div>

      {/* Formulario de entrada */}
      <div className="bg-white p-4 rounded-md border border-gray-200 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <input type="text" placeholder="Número" className="w-full p-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <input type="text" placeholder="Num Inversión" className="w-full p-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <input type="text" placeholder="Importe" className="w-full p-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <input type="text" placeholder="Fecha" className="w-full p-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <input type="text" placeholder="Descripción" className="w-full p-2 border border-gray-300 rounded-md" />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <input type="number" placeholder="Cantidad" className="w-full p-2 border border-gray-300 rounded-md" />
          </div>
          <div className="flex-1">
            <select className="w-full p-2 border border-gray-300 rounded-md">
              <option value="Sí">Inventariable</option>
              <option value="No">No Inventariable</option>
            </select>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end mb-6 gap-2">
        <Button>Añadir</Button>
        <Button>Editar</Button>
      </div>

      {/* Tabla de órdenes */}
      <div className="bg-white border border-gray-200 rounded-md mb-6 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="p-3 text-left">Número</th>
              <th className="p-3 text-left">Num Inversión</th>
              <th className="p-3 text-left">Importe</th>
              <th className="p-3 text-left">Fecha</th>
              <th className="p-3 text-left">Descripción</th>
              <th className="p-3 text-left">Cantidad</th>
              <th className="p-3 text-left">Inventariable</th>
            </tr>
          </thead>
          <tbody>{/* Aquí irían las filas de datos */}</tbody>
        </table>
      </div>

      {/* Botones de acción inferiores */}
      <div className="flex justify-end gap-2">
        <Button>Eliminar</Button>
        <Button>Guardar</Button>
      </div>
    </div>
  )
}
