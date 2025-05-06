import { getOrden } from "@/app/api/functions/orden"
import { getPresupuestoMensual } from "@/app/api/functions/presupuestos"
import { getDepartamentos } from "@/app/api/functions/departamentos"
import { ChevronDown } from "lucide-react"
import Link from "next/link"
import PresupuestoClient from './presupuesto-client'

// Primer paso: Confirmar que esta función se ejecuta correctamente
export default async function PresupuestosPage() {
  // Obtener datos iniciales básicos
  const departamentos = await getDepartamentos()
  const orden = await getOrden()
  const departamentoInfo = { id_Departamento: 1 }
  const presupuestoMensual = await getPresupuestoMensual(departamentoInfo.id_Departamento)

  // Obtener el mes actual y año
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
  const mesActual = meses[new Date().getMonth()]
  const año = new Date().getFullYear()

  // Pasar los datos iniciales al componente cliente
  return (
    <PresupuestoClient 
      initialOrden={orden}
      initialDepartamentos={departamentos}
      initialPresupuestoMensual={presupuestoMensual}
      mesActual={mesActual}
      año={año}
    />
  )
}