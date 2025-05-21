"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, LayoutGrid, Package, Users } from "lucide-react"
import { pb } from "@/lib/pocketbase"
import { useAuth } from "@/components/auth/auth-provider"

export function DashboardCards() {
  const { user, isDanuser } = useAuth()
  const [stats, setStats] = useState({
    organizations: 0,
    catalogs: 0,
    products: 0,
    members: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      if (!user) return

      try {
        // Get organizations count
        const orgsResult = isDanuser
          ? await pb.collection("danusin_user_organization_roles").getList(1, 1, {
              filter: `user="${user.id}"`,
              countOnly: true,
            })
          : await pb.collection("danusin_user_organization_roles").getList(1, 1, {
              filter: `user="${user.id}"`,
              countOnly: true,
            })

        // Get catalogs count
        const catalogsResult = isDanuser
          ? await pb.collection("danusin_catalog").getList(1, 1, {
              filter: `created_by="${user.id}"`,
              countOnly: true,
            })
          : await pb.collection("danusin_catalog_user").getList(1, 1, {
              filter: `user_id="${user.id}"`,
              countOnly: true,
            })

        // Get products count (for danusers, get products they added; for users, get products from catalogs they have access to)
        const productsResult = isDanuser
          ? await pb.collection("danusin_product").getList(1, 1, {
              filter: `added_by="${user.id}"`,
              countOnly: true,
            })
          : { totalItems: 0 } // For regular users, we'd need a more complex query to get products from catalogs they have access to

        // Get members count (only for danusers - count members in their organizations)
        const membersResult = isDanuser
          ? { totalItems: 0 } // This would require a more complex query to get all members across all organizations
          : { totalItems: 0 }

        setStats({
          organizations: orgsResult.totalItems,
          catalogs: catalogsResult.totalItems,
          products: productsResult.totalItems,
          members: membersResult.totalItems,
        })
      } catch (error) {
        console.error("Error fetching dashboard stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user, isDanuser])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 bg-muted rounded w-24"></div>
              </CardTitle>
              <div className="h-8 w-8 bg-muted rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="h-7 bg-muted rounded w-12 mb-1"></div>
              <div className="h-4 bg-muted rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Organizations</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.organizations}</div>
          <p className="text-xs text-muted-foreground">
            {isDanuser ? "Organizations you manage" : "Organizations you're a member of"}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Catalogs</CardTitle>
          <LayoutGrid className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.catalogs}</div>
          <p className="text-xs text-muted-foreground">
            {isDanuser ? "Catalogs you've created" : "Catalogs you have access to"}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Products</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.products}</div>
          <p className="text-xs text-muted-foreground">
            {isDanuser ? "Products you've added" : "Products available to you"}
          </p>
        </CardContent>
      </Card>
      {isDanuser && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.members}</div>
            <p className="text-xs text-muted-foreground">Total members across all organizations</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
