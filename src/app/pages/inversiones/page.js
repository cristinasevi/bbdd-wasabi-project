import { getOrden } from "@/app/api/functions/orden"
import { getResumenInversion } from "@/app/api/functions/resumen" 
import { getDepartamentos } from "@/app/api/functions/departamentos"
import InversionClient from "./inversion-client"

export default async function InversionPage() {
  // Obtener datos iniciales
  const orden = await getOrden()
  const departamentos = await getDepartamentos()
  
  // Obtener el mes actual y año
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
  const mesActual = meses[new Date().getMonth()]
  const año = new Date().getFullYear()

  return (
    <InversionClient
      initialOrden={orden}
      initialDepartamentos={departamentos}
      mesActual={mesActual}
      año={año}
    />
  )
}