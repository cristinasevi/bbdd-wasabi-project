// import { getDepartamentos } from "@/app/api/functions/select"

// export default async function Resumen({ params }) {
//     const departamento = decodeURIComponent(params.departamento);
//     const data = await getDepartamentos(departamento);

//     return (
//         <div className="p-8">
//             <h1 className="text-3xl font-bold mb-2">Resumen</h1>
//             <h2 className="text-lg text-gray-400">Departamento {departamento}</h2>
//         </div>
//     );
// }


import { getDepartamentos } from "@/app/api/functions/departamentos"
//import { getDepartamentoData } from "@/app/api/functions/getDepartamentoData"
import { getResumenDepPrep, getResumenDepInv, getOrden } from "@/app/api/resumenDep"


export default async function Resumen({ params }) {
    const departamento = decodeURIComponent(params.departamento);
    const departamentos = await getDepartamentos();
    
    // Encontrar el departamento específico en la lista
    const departamentoInfo = departamentos.find(d => d.Nombre === departamento) || {};

    const resumenDepPrep = await getResumenDepPrep(departamentoInfo.id_Departamento);
    const resumenDepInv = await getResumenDepInv(departamentoInfo.id_Departamento);
    const ordenesCompra = await getOrden(departamentoInfo.id_Departamento);
    // Obtener datos financieros y órdenes de compra
    //const data = await getDepartamentoData(departamento);
    
    // Obtener el mes actual y año
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const mesActual = meses[new Date().getMonth()];
    const año = new Date().getFullYear();

    return (
        <div>
            <div className="p-8">
                <div>
                    <h1 className="text-3xl font-bold">Resumen</h1>
                    <h2 className="text-xl text-gray-400">Departamento {departamento}</h2>
                </div>

                {/* Selector de fecha */}
                <div className="flex justify-end my-6">
                    <div className="relative">
                        <select className="appearance-none bg-white border border-gray-200 rounded-md px-4 py-2 pr-8">
                            <option>{`${mesActual} ${año}`}</option>
                        </select>
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m6 9 6 6 6-6" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Tarjetas de información */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Presupuesto total anual */}
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                        <h3 className="text-gray-500 mb-2">Presupuesto total anual</h3>
                        <div className="text-4xl font-bold">
                            {resumenDepPrep?.[0]?.total_presupuesto?.toLocaleString("es-ES")} €
                        </div>
                        <div className="mt-4 flex justify-end">
                            <div className="w-4 h-4 rounded-full bg-green-500"></div>
                        </div>
                    </div>

                    {/* Inversión total anual */}
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                        <h3 className="text-gray-500 mb-2">Inversión total anual</h3>
                        <div className="text-4xl font-bold">
                            {resumenDepInv?.[0]?.total_inversion?.toLocaleString("es-ES")} €
                        </div>
                    </div>

                    {/* Gasto acumulado anual */}
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                        <h3 className="text-gray-500 mb-2">Gasto acumulado anual</h3>
                        <div className="text-4xl font-bold"></div>
                    </div>

                    {/* Inversión acumulada anual */}
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                        <h3 className="text-gray-500 mb-2">Inversión acumulada anual</h3>
                        <div className="text-4xl font-bold"></div>
                    </div>
                </div>

                {/* Órdenes de compra */}
                <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold">ÓRDENES DE COMPRA</h3>
                        <button className="bg-black text-white text-sm px-3 py-1 rounded-md">
                            Ver detalles
                        </button>
                    </div>

                    <table className="w-full">
                        <thead>
                            <tr className="text-left">
                                <th className="pb-2 font-normal text-gray-500">Número</th>
                                <th className="pb-2 font-normal text-gray-500 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
            {ordenesCompra.map((item) => (
              <tr key={item.idOrden} className="border-t border-gray-200">
                  <td className="py-3 px-4">{item.Num_orden}</td>
                  <td className="py-3 px-4 text-right">{item.Importe}€</td>
                  
              </tr>
            ))}
          </tbody>
                    </table>
                </div>

                {/* Gráfico de gastos anuales */}
                {/* <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h3 className="font-bold mb-4">Gastos anuales</h3>
                    <div className="h-[200px] relative">
                        <div className="absolute inset-0 flex flex-col justify-between">
                            {[5000, 4000, 3000, 2000, 1000, 0].map((value) => (
                                <div key={value} className="border-t border-gray-100 relative h-0">
                                    <span className="absolute -top-2 left-0 text-xs text-gray-400">{value}€</span>
                                </div>
                            ))}
                        </div>
                        
                        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
                            {["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"].map((mes, index) => (
                                <span key={index} className="text-xs text-gray-500">{mes}</span>
                            ))}
                        </div>
                    </div>
                </div> */}
            </div>
        </div>
    );
}
