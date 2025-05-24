import { DashboardCards } from "@/components/dashboard/dashboard-cards"
import { OrganizationsList } from "@/components/dashboard/organizations-list"
import { RecommendedProducts } from "@/components/dashboard/recommended-products"

export default function DashboardManagePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <DashboardCards />
      <div className="grid grid-cols-1 gap-6">
        <OrganizationsList showEmpty={true} />
        <RecommendedProducts />
      </div>
    </div>
  )
}
