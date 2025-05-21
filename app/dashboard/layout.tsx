import type React from "react"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-green-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <DashboardSidebar />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar />

      {/* Main Content */}
      <div className="lg:pl-64">
        <main className="container mx-auto p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
