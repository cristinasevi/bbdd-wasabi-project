"use client"
export default function Informes() {
    const meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    // Se generan los años dinámicamente sin que tengas que actualizarlo. En este caso empieza desde 2020 hasta hoy
    const currentYear = new Date().getFullYear();
    const años = Array.from({ length: currentYear - 2020 + 1 }, (_, i) => 2020 + i);

    return (
        <div className="p-6">
            {/* Encabezado */}
            <div className="mb-16">
                <h1 className="text-3xl font-bold">Informes</h1>
                <h2 className="text-xl text-gray-400">Departamento </h2>
            </div>

            <div className="flex items-center justify-center my-8">
                <div className="w-full max-w-md p-10 bg-gray-50 rounded-lg shadow-lg">
                <div className="flex items-center gap-3 mb-8 justify-center">
                    <h1 className="text-2xl font-bold text-gray-600">Período Informe</h1>
                </div>
        
                <form className="space-y-6">
                    <div>
                        <label htmlFor="mes" className="block text-gray-700 mb-2">
                            Mes
                        </label>
                        <select
                            id="mes"
                            className="w-full bg-white px-4 py-3 border border-gray-300 text-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                            <option value="">Selecciona un mes</option>
                            {meses.map((mes, index) => (
                                <option key={index} value={mes.toLowerCase()}>
                                    {mes}
                                </option>
                            ))}
                        </select>
                    </div>
        
                    <div>
                        <label htmlFor="año" className="block text-gray-700 mb-2">
                            Año
                        </label>
                        <select
                            id="año"
                            className="w-full bg-white px-4 py-3 border border-gray-300 text-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                            <option value="">Selecciona un año</option>
                            {años.map((año) => (
                                <option key={año} value={año}>
                                    {año}
                                </option>
                            ))}
                        </select>
                    </div>
        
                    <button
                        type="button"
                        className="w-full bg-red-600 text-white py-3 rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 cursor-pointer"
                    >
                        Generar informe
                    </button>
                </form>
                </div>
            </div>
        </div>
    );
}