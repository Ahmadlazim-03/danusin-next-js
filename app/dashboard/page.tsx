import { Suspense } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardCards } from "@/components/dashboard/dashboard-cards"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"
import { OrganizationsList } from "@/components/dashboard/organizations-list"
import { CatalogsList } from "@/components/dashboard/catalogs-list"

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <DashboardHeader />

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardCards />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Suspense fallback={<div className="h-96 bg-white rounded-lg animate-pulse" />}>
          <OrganizationsList />
        </Suspense>

        <Suspense fallback={<div className="h-96 bg-white rounded-lg animate-pulse" />}>
          <CatalogsList />
        </Suspense>
      </div>
    </div>
  )
}
