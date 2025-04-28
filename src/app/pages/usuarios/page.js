import { getUsuariosConPermisos } from "@/app/api/functions/usuarios"
import { getRol } from "@/app/api/functions/rol"
import { getDepartamentos } from "@/app/api/functions/departamentos"
import UsuariosClient from "./usuariosClient"

export default async function Usuarios() {
    const usuarios = await getUsuariosConPermisos()
    const roles = await getRol()
    const departamentos = await getDepartamentos()

    return (
        <UsuariosClient 
            initialUsuarios={usuarios} 
            initialRoles={roles} 
            initialDepartamentos={departamentos} 
        />
    )
}