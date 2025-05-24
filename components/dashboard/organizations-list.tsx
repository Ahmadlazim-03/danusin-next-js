"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { pb } from "@/lib/pocketbase"
import { Building2, Plus, Settings } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

type Organization = {
  id: string
  organization_name: string
  organization_description: string
  organization_image: string
  organization_slug: string
  target: number
  target_progress: number
}

export function OrganizationsList({ showEmpty = false }: { showEmpty?: boolean }) {
  const { user, isDanuser } = useAuth()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [userRoles, setUserRoles] = useState<Record<string, string>>({})
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

    async function fetchOrganizations() {
      if (!user) return

      try {
        // Get all user organization roles
        const userOrgsCancelToken = `user_orgs_${Date.now()}`
        cancelTokensRef.current.push(userOrgsCancelToken)

        const userOrgsResult = await pb.collection("danusin_user_organization_roles").getList(1, 100, {
          filter: `user="${user.id}"`,
          $autoCancel: false,
          $cancelKey: userOrgsCancelToken,
        })

        if (!isMountedRef.current) return

        // Create a map of organization IDs to roles
        const roles: Record<string, string> = {}
        const orgIds: string[] = []

        userOrgsResult.items.forEach((item: any) => {
          if (item.organization) {
            roles[item.organization] = item.role
            orgIds.push(item.organization)
          }
        })

        setUserRoles(roles)

        if (orgIds.length === 0) {
          setOrganizations([])
          setLoading(false)
          return
        }

        // Fetch organization details for each organization ID
        const orgsPromises = orgIds.map((id) => {
          const orgCancelToken = `org_${id}_${Date.now()}`
          cancelTokensRef.current.push(orgCancelToken)

          return pb
            .collection("danusin_organization")
            .getOne(id, {
              $autoCancel: false,
              $cancelKey: orgCancelToken,
            })
            .catch((err) => {
              if (err.name !== "AbortError" && err.message !== "The request was autocancelled") {
                console.error(`Error fetching organization ${id}:`, err)
              }
              return null
            })
        })

        const orgsResults = await Promise.all(orgsPromises)

        if (!isMountedRef.current) return

        const validOrgs = orgsResults.filter(Boolean) as Organization[]
        setOrganizations(validOrgs)
      } catch (error: any) {
        // Only log errors that aren't related to cancellation
        if (error.name !== "AbortError" && error.message !== "The request was autocancelled") {
          console.error("Error fetching organizations:", error)
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false)
        }
      }
    }

    if (user) {
      fetchOrganizations()
    }
  }, [user])

  if (loading) {
    return (
      <Card className="dark:border-zinc-750/70 bg-white dark:bg-zinc-800/80">
        <CardHeader className="pb-0">
          <h2 className="text-xl font-bold">Your Organizations</h2>
          <p className="text-sm text-muted-foreground">Organizations you manage or are a member of</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-md" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (organizations.length === 0 && !showEmpty) {
    return null
  }

  return (
    <Card className="dark:border-zinc-700/50 bg-white dark:bg-zinc-800/80">
      <CardHeader className="flex flex-row items-start justify-between pb-0">
        <div>
          <h2 className="text-xl font-bold">Your Organizations</h2>
          <p className="text-sm text-muted-foreground">Organizations you manage or are a member of</p>
        </div>
        {isDanuser && (
          <Button asChild size="sm" className="bg-green-600 hover:bg-green-700">
            <Link href="/dashboard/organizations/new">
              <Plus className="mr-1 h-4 w-4" /> New
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {organizations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4">
              <Building2 className="mx-auto h-16 w-16 text-muted-foreground/60" />
            </div>
            <h3 className="mb-1 text-lg font-medium">No organizations yet</h3>
            <p className="mb-6 max-w-sm text-sm text-muted-foreground">
              Create your first organization to start managing catalogs and products.
            </p>
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link href="/dashboard/organizations/new">Create Organization</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {organizations.map((org) => (
              <div key={org.id} className="flex items-start gap-4 rounded-lg p-3 transition-colors hover:bg-muted">
                <div className="flex-shrink-0 overflow-hidden rounded-md h-12 w-12">
                  <Image
                    src={org.organization_image || "/placeholder.svg?height=48&width=48"}
                    alt={org.organization_name}
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">{org.organization_name}</h3>
                    <Badge
                      variant={
                        userRoles[org.id] === "admin"
                          ? "default"
                          : userRoles[org.id] === "moderator"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {userRoles[org.id]}
                    </Badge>
                  </div>
                  <p className="mb-2 line-clamp-1 text-xs text-muted-foreground">{org.organization_description}</p>
                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/organizations/${org.organization_slug}`}>View</Link>
                    </Button>
                    {(userRoles[org.id] === "admin" || userRoles[org.id] === "moderator") && (
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/organizations/${org.id}`}>
                          <Settings className="mr-1 h-3 w-3" /> Manage
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
