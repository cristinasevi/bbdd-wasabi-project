import { getOrden } from "@/app/api/functions/orden"
import { getDepartamentos } from "@/app/api/functions/departamentos"
import { getPresupuestoMensual } from "@/app/api/functions/presupuestos"
import { getResumenGasto } from "@/app/api/functions/resumen"
import PresupuestoClient from './presupuestos-client'

export default async function PresupuestosPage() {
  // Obtener datos iniciales básicos
  const departamentos = await getDepartamentos()
  const orden = await getOrden()
  
  // Preparar datos de presupuestos para cada departamento
  const presupuestosPorDepartamento = {}
  const gastosPorDepartamento = {}
  
  // Pre-cargar datos de presupuesto para cada departamento
  for (const dep of departamentos) {
    const presupuestoMensual = await getPresupuestoMensual(dep.id_Departamento)
    presupuestosPorDepartamento[dep.id_Departamento] = presupuestoMensual
    
    const gastoData = await getResumenGasto(dep.id_Departamento)
    gastosPorDepartamento[dep.id_Departamento] = gastoData
  }
  
  // Obtener el mes actual y año
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
  const mesActual = meses[new Date().getMonth()]
  const año = new Date().getFullYear()

  return (
    <PresupuestoClient 
      initialOrden={orden}
      initialDepartamentos={departamentos}
      presupuestosPorDepartamento={presupuestosPorDepartamento}
      gastosPorDepartamento={gastosPorDepartamento}
      mesActual={mesActual}
      año={año}
    />
  )
}