import { getOrden } from "@/app/api/functions/orden"
import { getDepartamentos } from "@/app/api/functions/departamentos"
import { getProveedores } from "@/app/api/functions/proveedores"
import InventarioClient from "./inventarioClient"

export default async function InventarioPage() {
  const inventarios = await getOrden()
  const departamentos = await getDepartamentos()
  const proveedores = await getProveedores()

  return (
    <InventarioClient
      initialInventarios={inventarios}
      initialDepartamentos={departamentos}
      initialProveedores={proveedores}
    />
  )
}