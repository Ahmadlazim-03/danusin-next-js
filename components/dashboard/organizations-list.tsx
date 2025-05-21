"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { pb } from "@/lib/pocketbase"
import { useAuth } from "@/components/auth/auth-provider"
import Link from "next/link"
import { Building2, Plus } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { ProgressBar } from "@/components/ui/progress-bar"
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
      <Card>
        <CardHeader>
          <CardTitle>Your Organizations</CardTitle>
          <CardDescription>Organizations you manage or are a member of</CardDescription>
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
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Your Organizations</CardTitle>
          <CardDescription>Organizations you manage or are a member of</CardDescription>
        </div>
        {isDanuser && (
          <Button asChild size="sm" className="bg-green-600 hover:bg-green-700">
            <Link href="/dashboard/organizations/new">
              <Plus className="h-4 w-4 mr-1" /> New
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {organizations.length === 0 ? (
          <div className="text-center py-6">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <h3 className="font-medium text-lg mb-1">No organizations yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              {isDanuser
                ? "Create your first organization to start managing catalogs and products."
                : "Join an organization to view catalogs and products."}
            </p>
            {isDanuser && (
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <Link href="/dashboard/organizations/new">Create Organization</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {organizations.map((org) => (
              <Link
                key={org.id}
                href={`/organizations/${org.organization_slug}`}
                className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="h-12 w-12 rounded-md overflow-hidden flex-shrink-0">
                  <Image
                    src={org.organization_image || "/placeholder.svg?height=48&width=48"}
                    alt={org.organization_name}
                    width={48}
                    height={48}
                    className="object-cover h-full w-full"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm">{org.organization_name}</h3>
                  <p className="text-muted-foreground text-xs line-clamp-1 mb-2">{org.organization_description}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Fundraising Goal: ${org.target.toLocaleString()}</span>
                      <span>{Math.round((org.target_progress / org.target) * 100)}%</span>
                    </div>
                    <ProgressBar value={(org.target_progress / org.target) * 100} className="h-1.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
