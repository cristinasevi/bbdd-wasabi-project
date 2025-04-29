"use client"

import { User, LogOut } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import Image from "next/image"

export default function Header() {
  const { data: session, status } = useSession()

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" })
  }

  return (
    <header className="h-16 flex items-center justify-end px-6">
      <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
        {session?.user?.image ? (
          <div className="w-5 h-5 relative rounded-full overflow-hidden">
            <Image
              src={session.user.image || "/placeholder.svg"}
              alt={session.user.name || "Usuario"}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <User className="w-5 h-5" />
        )}
        <span>{session?.user?.name || session?.user?.email || "user"}</span>
      </div>
      <button onClick={handleLogout} className="ml-6 mr-2 cursor-pointer" aria-label="Cerrar sesión">
        <LogOut className="w-4 h-4" />
      </button>
    </header>
  )
}
