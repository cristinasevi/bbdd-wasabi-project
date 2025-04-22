"use client"

import { useState } from "react"
import Link from "next/link"
import { Home, Wallet, ChartColumnIncreasing, ShoppingCart,
        ReceiptText, Truck, Package, Users, FileText } from "lucide-react"
import Image from "next/image"

export default function Navbar() {
    const [activeItem, setActiveItem] = useState("Inicio")

    const navItems = [
        { name: "Inicio", href: "/", icon: Home },
        { name: "Presupuestos", href: "/pages/presupuestos", icon: Wallet },
        { name: "Inversiones", href: "/pages/inversiones", icon: ChartColumnIncreasing },
        { name: "Órdenes de Compra", href: "/pages/ordenes-compra", icon: ShoppingCart },
        { name: "Facturas", href: "/pages/facturas", icon: ReceiptText },
        { name: "Proveedores", href: "/pages/proveedores", icon: Truck },
        { name: "Inventario", href: "/pages/inventario", icon: Package },
        { name: "Gestión de Usuarios", href: "/pages/usuarios", icon: Users },
        { name: "Informes", href: "/pages/informes", icon: FileText },
    ]

    return (
        <div className="h-full w-64 border-r border-gray-200 flex flex-col fixed left-0 top-0">
            <div className="p-6 flex justify-center">
                <div className="w-60 h-32">
                    <Link href="/">
                        <Image
                            src="/images/logo.jpg"
                            alt="Logo Salesianos"
                            width={400}
                            height={400}
                            priority
                            className="object-contain"
                        />
                    </Link>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto">
                <ul className="py-4">
                    {navItems.map((item) => {
                        const Icon = item.icon

                        return (
                            <li key={item.name} className="mb-2">
                                <Link
                                    href={item.href}
                                    className={`flex items-center px-6 py-3 ${activeItem === item.name
                                        ? "text-red-600 bg-red-50 border-l-2 border-red-600" 
                                        : "text-gray-700 hover:bg-gray-100"}`}
                                    onClick={() => setActiveItem(item.name)}
                                >
                                    <Icon className="w-5 h-5 mr-7" />
                                    {item.name}
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </nav>
        </div>
    );
}
