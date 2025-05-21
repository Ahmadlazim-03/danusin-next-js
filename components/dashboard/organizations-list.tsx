"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { pb } from "@/lib/pocketbase"
import { useAuth } from "@/components/auth/auth-provider"
import Link from "next/link"
import { Building2, Plus } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"

type Organization = {
  id: string
  organization_name: string
  organization_description: string
  organization_image: string
  organization_slug: string
  target: number
  target_progress: number
}

export function OrganizationsList() {
  const { user, isDanuser } = useAuth()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrganizations() {
      if (!user) return

      try {
        // Get organizations the user is a member of
        const userOrgsResult = await pb.collection("danusin_user_organization_roles").getList(1, 10, {
          filter: `user="${user.id}"`,
          expand: "organization",
        })

        const orgs = userOrgsResult.items.map((item: any) => item.expand?.organization)
        setOrganizations(orgs.filter(Boolean))
      } catch (error) {
        console.error("Error fetching organizations:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrganizations()
  }, [user])

  if (loading) {
    return (
      <Card className="border-green-100 bg-white">
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

  return (
    <Card className="border-green-100 bg-white">
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
              <Link
                key={org.id}
                href={`/organizations/${org.organization_slug}`}
                className="flex items-start gap-4 rounded-lg p-3 transition-colors hover:bg-muted"
              >
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
                  <h3 className="text-sm font-medium">{org.organization_name}</h3>
                  <p className="mb-2 line-clamp-1 text-xs text-muted-foreground">{org.organization_description}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
