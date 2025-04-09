import { User, LogOut } from "lucide-react"
import Link from "next/link"

export default function Header() {
  return (
    <header className="h-16 flex items-center justify-end px-6">
      <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
        <User className="w-5 h-5" />
        <span>user</span>
      </div>
      <Link href="/login" className="ml-6 mr-2">
        <LogOut className="w-4 h-4" />
      </Link>
    </header>
  );
}