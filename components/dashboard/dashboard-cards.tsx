"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent } from "@/components/ui/card"
import { pb } from "@/lib/pocketbase"
import { useEffect, useRef, useState } from "react"

export function DashboardCards() {
  const { user, isDanuser } = useAuth()
  const [stats, setStats] = useState({
    organizations: 0,
    products: 0,
    members: 0,
  })
  const [loading, setLoading] = useState(true)
  const cancelTokensRef = useRef<string[]>([])
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
      // Cancel all pending requests on unmount
      cancelTokensRef.current.forEach((token) => {
        pb.cancelRequest(token)
      })
    }
  }, [])

  useEffect(() => {
    // Clear previous cancel tokens
    cancelTokensRef.current.forEach((token) => {
      pb.cancelRequest(token)
    })
    cancelTokensRef.current = []

    async function fetchStats() {
      if (!user) return

      try {
        // Get organizations count
        let orgsCount = 0
        try {
          const orgsCancelToken = `orgs_count_${Date.now()}`
          cancelTokensRef.current.push(orgsCancelToken)

          const orgsResult = await pb.collection("danusin_user_organization_roles").getList(1, 1, {
            filter: `user="${user.id}"`,
            countOnly: true,
            $autoCancel: false,
            $cancelKey: orgsCancelToken,
          })

          orgsCount = orgsResult.totalItems
        } catch (error: any) {
          // Skip logging for auto-cancellation
          if (error.name !== "AbortError" && error.message !== "The request was autocancelled") {
            console.error("Error fetching organizations count:", error)
          }
        }

        if (!isMountedRef.current) return

        // Get products count
        let productsCount = 0
        try {
          const productsCancelToken = `products_count_${Date.now()}`
          cancelTokensRef.current.push(productsCancelToken)

          const productsResult = await pb.collection("danusin_product").getList(1, 1, {
            filter: `added_by="${user.id}"`,
            countOnly: true,
            $autoCancel: false,
            $cancelKey: productsCancelToken,
          })

          productsCount = productsResult.totalItems
        } catch (error: any) {
          // Skip logging for auto-cancellation
          if (error.name !== "AbortError" && error.message !== "The request was autocancelled") {
            console.error("Error fetching products count:", error)
          }
        }

        if (!isMountedRef.current) return

        // Get members count
        let membersCount = 0
        if (isDanuser) {
          try {
            // First get all organizations where user is admin
            const userOrgsCancelToken = `user_orgs_${Date.now()}`
            cancelTokensRef.current.push(userOrgsCancelToken)

            const userOrgs = await pb.collection("danusin_user_organization_roles").getList(1, 100, {
              filter: `user="${user.id}" && (role="admin" || role="moderator")`,
              $autoCancel: false,
              $cancelKey: userOrgsCancelToken,
            })

            if (isMountedRef.current && userOrgs.items.length > 0) {
              // Get organization IDs
              const orgIds = userOrgs.items.map((item: any) => item.organization)

              // Count members across all organizations - process each organization separately
              let totalMembers = 0

              for (const orgId of orgIds) {
                if (!isMountedRef.current) break // Stop processing if component unmounted

                try {
                  const orgMembersCancelToken = `org_members_${orgId}_${Date.now()}`
                  cancelTokensRef.current.push(orgMembersCancelToken)

                  const orgMembers = await pb.collection("danusin_user_organization_roles").getList(1, 1, {
                    filter: `organization="${orgId}"`,
                    countOnly: true,
                    $autoCancel: false,
                    $cancelKey: orgMembersCancelToken,
                  })

                  totalMembers += orgMembers.totalItems
                } catch (err: any) {
                  // Skip logging for auto-cancellation
                  if (err.name !== "AbortError" && err.message !== "The request was autocancelled") {
                    console.error(`Error fetching members for org ${orgId}:`, err)
                  }
                }
              }

              if (isMountedRef.current) {
                membersCount = totalMembers
              }
            }
          } catch (error: any) {
            // Skip logging for auto-cancellation
            if (error.name !== "AbortError" && error.message !== "The request was autocancelled") {
              console.error("Error fetching members count:", error)
            }
          }
        }

        if (!isMountedRef.current) return

        setStats({
          organizations: orgsCount,
          products: productsCount,
          members: membersCount,
        })
      } catch (error: any) {
        // Skip logging for auto-cancellation
        if (error.name !== "AbortError" && error.message !== "The request was autocancelled") {
          console.error("Error fetching dashboard stats:", error)
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false)
        }
      }
    }

    if (user) {
      fetchStats()
    }
  }, [user, isDanuser])

  const statCards = [
    {
      title: "Organizations",
      value: stats.organizations,
      description: "Organizations you manage",
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {statCards.map((card, index) => (
        <Card key={index} className="dark:border-zinc-700/70 bg-white dark:bg-zinc-800/80">
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="mb-1 text-sm font-medium">{card.title}</h3>
              <p className="mb-1 text-4xl font-bold">{loading ? "-" : card.value}</p>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
