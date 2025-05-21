"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent } from "@/components/ui/card"
import { pb } from "@/lib/pocketbase"
import { useEffect, useState } from "react"

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
    let isMounted = true

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

        if (!isMounted) return

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

        if (!isMounted) return

        // Get products count (for danusers, get products they added; for users, get products from catalogs they have access to)
        const productsResult = isDanuser
          ? await pb.collection("danusin_product").getList(1, 1, {
              filter: `added_by="${user.id}"`,
              countOnly: true,
            })
          : { totalItems: 0 } // For regular users, we'd need a more complex query to get products from catalogs they have access to

        if (!isMounted) return

        // Get members count (only for danusers - count members in their organizations)
        const membersResult = isDanuser
          ? { totalItems: 0 } // This would require a more complex query to get all members across all organizations
          : { totalItems: 0 }

        if (!isMounted) return

        setStats({
          organizations: orgsResult.totalItems,
          catalogs: catalogsResult.totalItems,
          products: productsResult.totalItems,
          members: membersResult.totalItems,
        })
      } catch (error: any) {
        // Check if this is an auto-cancellation error (can be ignored)
        if (error.name !== "AbortError" && error.message !== "The request was autocancelled") {
          console.error("Error fetching dashboard stats:", error)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchStats()

    // Cleanup function to prevent setting state after unmount
    return () => {
      isMounted = false
    }
  }, [user, isDanuser])

  const statCards = [
    {
      title: "Organizations",
      value: stats.organizations,
      description: "Organizations you manage",
    },
    {
      title: "Catalogs",
      value: stats.catalogs,
      description: "Catalogs you've created",
    },
    {
      title: "Products",
      value: stats.products,
      description: "Products you've added",
    },
    {
      title: "Members",
      value: stats.members,
      description: "Total members across all organizations",
    },
  ]

  return (
    <div className="grid grid-cols-4 gap-4">
      {statCards.map((card, index) => (
        <Card key={index} className="border-green-100 bg-white">
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="mb-1 text-sm font-medium">{card.title}</h3>
              <p className="mb-1 text-4xl font-bold">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
