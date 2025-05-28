"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Building2, Home, LogOut, Map, MapPin, Package, Settings } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export const dashboardNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Organizations",
    href: "/dashboard/organizations",
    icon: Building2,
  },
  {
    title: "Products",
    href: "/dashboard/products",
    icon: Package,
  },
  
  {
    title: "Map",
    href: "/dashboard/map",
    icon: Map,
  },
  {
    title:"Setting",
    href:"/dashboard/profile",
    icon: Settings,
  }
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <div className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r bg-background md:flex">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Package className="h-5 w-5 text-green-600" />
          <span>Danusin</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm font-medium">
          {dashboardNavItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground",
                pathname === item.href && "bg-muted text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          ))}
          <Link
            href="/dashboard/map/start"
            className={cn(
              "mt-6 flex items-center gap-3 rounded-lg bg-green-600 px-3 py-2 text-white transition-all hover:bg-green-700",
              pathname === "/dashboard/map/start" && "bg-green-700",
            )}
          >
            <MapPin className="h-4 w-4" />
            START DANUSIN!
          </Link>
        </nav>
      </div>
      <div className="mt-auto border-t p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name || "User"} />
            <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="text-sm font-medium">{user?.name || "User"}</div>
            <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
          </div>
          <Button variant="ghost" size="icon" onClick={logout} title="Logout">
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Logout</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
