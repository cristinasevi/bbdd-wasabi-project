import { getOrden } from "@/app/api/functions/orden"
import { ChevronDown } from "lucide-react"
import Link from "next/link"

export default async function InversionDepartamento() {
    const orden = await getOrden()

    return (
        <div className="p-6">
            {/* Encabezado */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Inversión</h1>
                <h2 className="text-xl text-gray-400">Departamento </h2>
            </div>

            {/* Selector de fecha y botón de resumen */}
            <div className="flex justify-end mb-6 gap-4">
                <div className="relative">
                <button className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-full px-4 py-2">
                    {/* {mesActual} */}
                    <ChevronDown className="w-4 h-4" />
                </button>
                </div>
                <Link
                href={`/pages/resumen/`}
                className="bg-black text-white px-4 py-1 rounded-full hover:bg-gray-800"
                >
                Resumen
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Columna izquierda: Tarjetas financieras */}
                <div className="col-span-1">
                    <div className="grid gap-6">
                        {/* Presupuesto mensual */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h3 className="text-gray-500 mb-2">Inversión mensual</h3>
                            <div className="text-right">
                                <div className="text-5xl font-bold"></div>
                            </div>
                        </div>

                        {/* Gasto mensual */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h3 className="text-gray-500 mb-2">Gasto mensual</h3>
                            <div className="text-right">
                                <div className="text-5xl font-bold"></div>
                            </div>
                        </div>

                        {/* Saldo actual */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h3 className="text-gray-500 mb-2">Saldo actual</h3>
                            <div className="flex justify-between items-center">
                                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                                <div>
                                    <div className="text-5xl font-bold"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Columna derecha: Órdenes de compra */}
                <div className="col-span-1">
                    <div className="bg-white border border-gray-200 rounded-lg p-6 h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold">ÓRDENES DE COMPRA</h3>
                            <Link href="/pages/ordenes-compra" className="bg-black text-white text-sm px-3 py-1 rounded">
                                Ver detalles
                            </Link>
                        </div>

                        <div className="overflow-hidden mb-8 max-h-[480px] overflow-y-auto">
                            <table className="w-full">
                                <thead className="bg-white sticky top-0 z-10">
                                    <tr className="text-left">
                                        <th className="pb-2 font-normal text-gray-500">Número</th>
                                        <th className="pb-2 font-normal text-gray-500 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orden.map((item) => (
                                    <tr key={item.idOrden} className="border-t border-gray-200">
                                        <td className="py-2">{item.Num_orden}</td>
                                        <td className="py-2 text-right">{item.Importe}€</td>
                                    </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
