"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BarChart3, Building2, Globe, Home, LayoutGrid, LogOut, Menu, Package, Settings, User } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export function DashboardSidebar() {
  const pathname = usePathname()
  const { user, isDanuser, logout } = useAuth()

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + "/")
  }

  return (
    <SidebarProvider>
      {/* Mobile Sidebar */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-white">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <div className="h-full flex flex-col">
              <div className="p-4 border-b">
                <Link href="/" className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
                    D
                  </div>
                  <span className="font-bold text-xl">Danusin</span>
                </Link>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Dashboard
                    </div>
                    <nav className="space-y-1">
                      <Link href="/dashboard" passHref>
                        <Button
                          variant={isActive("/dashboard") ? "secondary" : "ghost"}
                          className="w-full justify-start"
                        >
                          <Home className="mr-2 h-4 w-4" />
                          Overview
                        </Button>
                      </Link>
                      <Link href="/dashboard/organizations" passHref>
                        <Button
                          variant={isActive("/dashboard/organizations") ? "secondary" : "ghost"}
                          className="w-full justify-start"
                        >
                          <Building2 className="mr-2 h-4 w-4" />
                          Organizations
                        </Button>
                      </Link>
                      <Link href="/dashboard/catalogs" passHref>
                        <Button
                          variant={isActive("/dashboard/catalogs") ? "secondary" : "ghost"}
                          className="w-full justify-start"
                        >
                          <LayoutGrid className="mr-2 h-4 w-4" />
                          Catalogs
                        </Button>
                      </Link>
                      <Link href="/dashboard/products" passHref>
                        <Button
                          variant={isActive("/dashboard/products") ? "secondary" : "ghost"}
                          className="w-full justify-start"
                        >
                          <Package className="mr-2 h-4 w-4" />
                          Products
                        </Button>
                      </Link>
                      <Link href="/dashboard/map" passHref>
                        <Button
                          variant={isActive("/dashboard/map") ? "secondary" : "ghost"}
                          className="w-full justify-start"
                        >
                          <Globe className="mr-2 h-4 w-4" />
                          Map
                        </Button>
                      </Link>
                      {isDanuser && (
                        <Link href="/dashboard/trends" passHref>
                          <Button
                            variant={isActive("/dashboard/trends") ? "secondary" : "ghost"}
                            className="w-full justify-start"
                          >
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Trends
                          </Button>
                        </Link>
                      )}
                    </nav>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account</div>
                    <nav className="space-y-1">
                      <Link href="/profile" passHref>
                        <Button variant={isActive("/profile") ? "secondary" : "ghost"} className="w-full justify-start">
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Button>
                      </Link>
                      <Link href="/settings" passHref>
                        <Button
                          variant={isActive("/settings") ? "secondary" : "ghost"}
                          className="w-full justify-start"
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={logout}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </Button>
                    </nav>
                  </div>
                </div>
              </ScrollArea>
              <div className="p-4 border-t">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center overflow-hidden">
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
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <Sidebar className="hidden lg:flex" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-4 py-2">
            <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
              D
            </div>
            <span className="font-bold text-xl">Danusin</span>
          </div>
          <SidebarTrigger />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/dashboard") && !pathname?.includes("/")}
                    tooltip="Overview"
                  >
                    <Link href="/dashboard">
                      <Home />
                      <span>Overview</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/dashboard/organizations")} tooltip="Organizations">
                    <Link href="/dashboard/organizations">
                      <Building2 />
                      <span>Organizations</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/dashboard/catalogs")} tooltip="Catalogs">
                    <Link href="/dashboard/catalogs">
                      <LayoutGrid />
                      <span>Catalogs</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/dashboard/products")} tooltip="Products">
                    <Link href="/dashboard/products">
                      <Package />
                      <span>Products</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/dashboard/map")} tooltip="Map">
                    <Link href="/dashboard/map">
                      <Globe />
                      <span>Map</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {isDanuser && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/dashboard/trends")} tooltip="Trends">
                      <Link href="/dashboard/trends">
                        <BarChart3 />
                        <span>Trends</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Account</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/profile")} tooltip="Profile">
                    <Link href="/profile">
                      <User />
                      <span>Profile</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/settings")} tooltip="Settings">
                    <Link href="/settings">
                      <Settings />
                      <span>Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div
            className={cn(
              "flex items-center gap-3 p-4",
              "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2",
            )}
          >
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center overflow-hidden">
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
            <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="group-data-[collapsible=icon]:hidden text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  )
}
