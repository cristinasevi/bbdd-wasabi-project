import { getOrden } from "@/app/api/functions/orden"
import Button from "@/app/components/ui/button"

export default async function OrdenesCompraPage() {
  const orden = await getOrden()

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

  function formatInventariable(value) {
    if (value === 1 || value === "1" || value === true) return "Sí"
    if (value === 0 || value === "0" || value === false) return "No"
    return value || "-" 
  }

  return (
    <div className="p-6">
      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Orden de Compra</h1>
        <h2 className="text-xl text-gray-400">Departamento </h2>
      </div>

      {/* Formulario de entrada */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <input type="date" placeholder="Fecha" className="w-full p-2 border border-gray-300 rounded-md text-gray-500" />
        </div>
        <div>
          <input type="text" placeholder="Descripción" className="w-full p-2 border border-gray-300 rounded-md" />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <input type="number" placeholder="Cantidad" className="w-full p-2 border border-gray-300 rounded-md" />
          </div>
          <div className="flex-1">
            <select className="w-full p-2 border border-gray-300 rounded-md text-gray-500">
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
      <div className="border border-gray-200 rounded-lg overflow-hidden mb-6 max-h-[390px] overflow-y-auto">
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-600">Num Orden</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Num Inversión</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Importe</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Fecha</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Descripción</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Inventariable</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Cantidad</th>
            </tr>
          </thead>
          <tbody>
            {orden.map((item) => (
              <tr key={`${item.idOrden}-${item.Num_inversion}`} className="border-t border-gray-200">
                  <td className="py-3 px-4">{item.Num_orden}</td>
                  <td className="py-3 px-4">{item.Num_inversion}</td>
                  <td className="py-3 px-4">{item.Importe}€</td>
                  <td className="py-3 px-4">{formatDate(item.Fecha)}</td>
                  <td className="py-3 px-4">{item.Descripcion}</td>
                  <td className="py-3 px-4">{formatInventariable(item.Inventariable)}</td>
                  <td className="py-3 px-4">{item.Cantidad}</td>
              </tr>
            ))}
          </tbody>
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
