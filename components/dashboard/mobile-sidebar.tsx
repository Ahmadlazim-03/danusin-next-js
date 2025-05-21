"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { BarChart3, Building2, Globe, Home, LayoutGrid, LogOut, Menu, Package, Settings, User } from "lucide-react"
import { cn } from "@/lib/utils"

export function MobileSidebar() {
  const pathname = usePathname()
  const { user, isDanuser, logout } = useAuth()
  const [open, setOpen] = useState(false)

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + "/")
  }

  return (
    <div className="fixed left-4 top-4 z-50 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="bg-white">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center border-b px-4">
              <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 font-bold text-white">
                  D
                </div>
                <span className="text-xl font-bold">Danusin</span>
              </Link>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-6">
                {/* Dashboard Section */}
                <div>
                  <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Dashboard
                  </h3>
                  <nav className="space-y-1">
                    <Link
                      href="/dashboard"
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        isActive("/dashboard") && !pathname?.includes("/dashboard/")
                          ? "bg-green-50 font-medium text-green-700"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                      onClick={() => setOpen(false)}
                    >
                      <Home className="h-4 w-4" />
                      <span>Overview</span>
                    </Link>
                    <Link
                      href="/dashboard/organizations"
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        isActive("/dashboard/organizations")
                          ? "bg-green-50 font-medium text-green-700"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                      onClick={() => setOpen(false)}
                    >
                      <Building2 className="h-4 w-4" />
                      <span>Organizations</span>
                    </Link>
                    <Link
                      href="/dashboard/catalogs"
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        isActive("/dashboard/catalogs")
                          ? "bg-green-50 font-medium text-green-700"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                      onClick={() => setOpen(false)}
                    >
                      <LayoutGrid className="h-4 w-4" />
                      <span>Catalogs</span>
                    </Link>
                    <Link
                      href="/dashboard/products"
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        isActive("/dashboard/products")
                          ? "bg-green-50 font-medium text-green-700"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                      onClick={() => setOpen(false)}
                    >
                      <Package className="h-4 w-4" />
                      <span>Products</span>
                    </Link>
                    <Link
                      href="/dashboard/map"
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        isActive("/dashboard/map")
                          ? "bg-green-50 font-medium text-green-700"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                      onClick={() => setOpen(false)}
                    >
                      <Globe className="h-4 w-4" />
                      <span>Map</span>
                    </Link>
                    {isDanuser && (
                      <Link
                        href="/dashboard/trends"
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                          isActive("/dashboard/trends")
                            ? "bg-green-50 font-medium text-green-700"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                        onClick={() => setOpen(false)}
                      >
                        <BarChart3 className="h-4 w-4" />
                        <span>Trends</span>
                      </Link>
                    )}
                  </nav>
                </div>

                {/* Account Section */}
                <div>
                  <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Account
                  </h3>
                  <nav className="space-y-1">
                    <Link
                      href="/profile"
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        isActive("/profile")
                          ? "bg-green-50 font-medium text-green-700"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                      onClick={() => setOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                    <Link
                      href="/settings"
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        isActive("/settings")
                          ? "bg-green-50 font-medium text-green-700"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                      onClick={() => setOpen(false)}
                    >
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </nav>
                </div>
              </div>
            </div>

            {/* User Profile */}
            <div className="border-t p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-green-100">
                  {user?.avatar ? (
                    <img
                      src={user.avatar || "/placeholder.svg"}
                      alt={user?.name || "User"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4 text-green-700" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{user?.name || "User"}</p>
                  <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:bg-red-50 hover:text-red-600"
                  onClick={() => {
                    logout()
                    setOpen(false)
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="sr-only">Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
