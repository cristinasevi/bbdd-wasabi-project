import { getOrden } from "@/app/api/functions/orden"
import { getDepartamentos } from "@/app/api/functions/departamentos"
import PresupuestoClient from './presupuesto-client'

export default async function PresupuestosPage() {
  // Obtener datos iniciales básicos
  const departamentos = await getDepartamentos()
  const orden = await getOrden()
  
  // Obtener el mes actual y año
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
  const mesActual = meses[new Date().getMonth()]
  const año = new Date().getFullYear()

  return (
    <PresupuestoClient 
      initialOrden={orden}
      initialDepartamentos={departamentos}
      initialPresupuestoMensual={[]}
      mesActual={mesActual}
      año={año}
    />
  )
}