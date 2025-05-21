import type React from "react"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-green-50">
      <DashboardSidebar />
      <main className="flex-1 p-6 md:p-8 pt-6">{children}</main>
    </div>
  )
}
