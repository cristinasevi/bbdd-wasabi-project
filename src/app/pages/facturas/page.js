import { getFacturas } from "@/app/api/functions/facturas"
import { ChevronDown, ArrowUpDown } from "lucide-react"
import Link from "next/link"

export default async function Facturas() {
    const facturas = await getFacturas()

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

    return (
        <div className="p-6">
            {/* Encabezado */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Facturas</h1>
                <h2 className="text-xl text-gray-400">Departamento </h2>
            </div>

            {/* Filtros */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                {/* {departamentoSeleccionado ? (
                    <Link href="/pages/facturas" className="text-gray-500">
                    <ArrowUpDown className="w-5 h-5" />
                    </Link>
                ) : (
                    departamentos.map((dep) => (
                    <Link
                        key={dep}
                        href={`/pages/facturas?departamento=${dep}`}
                        className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full hover:bg-gray-200"
                    >
                        {dep}
                    </Link>
                    ))
                )} */}
                </div>
            </div>

            {/* Tabla de facturas */}
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-6 max-h-[650px] overflow-y-auto">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr className="border-b border-gray-200">
                                <th className="py-3 px-4 text-left font-medium text-gray-600">Nº Factura</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-600">Proveedor</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-600">Fecha emisión</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-600">Num Orden</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-600">Estado</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-600">Departamento</th>
                                <th className="py-3 px-4 text-center font-medium text-gray-600"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {facturas.map((factura) => (
                                <tr key={factura.idFactura} className="border-t border-gray-200">
                                    <td className="py-3 px-4">{factura.Num_factura}</td>
                                    <td className="py-3 px-4">{factura.Proveedor}</td>
                                    <td className="py-3 px-4">{formatDate(factura.Fecha_emision)}</td>
                                    <td className="py-3 px-4">{factura.Num_orden}</td>
                                    <td className="py-3 px-4">
                                        <div className="relative w-32">
                                            <div
                                                className={`border rounded px-3 py-1 w-full text-sm ${
                                                factura.Estado === "Pagado"
                                                    ? "bg-green-50 text-green-800"
                                                    : factura.Estado === "Pendiente"
                                                    ? "bg-yellow-50 text-yellow-800"
                                                    : "bg-red-50 text-red-800"
                                                }`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span>{factura.Estado}</span>
                                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                                        {factura.Departamento}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <Link
                                        href={`/api/facturas/descargar?id=${factura.idFactura}`}
                                        className="bg-red-600 text-white text-sm px-3 py-1 rounded hover:bg-red-700"
                                        >
                                        Descargar
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
