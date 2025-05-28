"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { OrganizationCatalogs } from "@/components/organization/organization-catalogs"
import { OrganizationMembersList } from "@/components/organization/organization-members-list"
import { OrganizationProducts } from "@/components/organization/organization-products"
import { OrganizationSettings } from "@/components/organization/organization-settings"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { pb } from "@/lib/pocketbase"
import { ArrowLeft, Building2, LayoutGrid, Package, Settings, Users } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function OrganizationPage() {
  const { slug } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [organization, setOrganization] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    const fetchOrganization = async () => {
      if (!user || !slug) return

      try {
        // First, find the organization by slug
        const orgResult = await pb.collection("danusin_organization").getFirstListItem(`slug="${slug}"`, {
          signal: controller.signal,
          $autoCancel: false,
        })

        if (!isMounted) return

        if (!orgResult) {
          setError("Organization not found")
          setLoading(false)
          return
        }

        setOrganization(orgResult)

        // Check user's role in this organization
        const roleResult = await pb
          .collection("danusin_user_organization_roles")
          .getFirstListItem(`user="${user.id}" && organization="${orgResult.id}"`, {
            signal: controller.signal,
            $autoCancel: false,
          })

        if (!isMounted) return

        if (roleResult) {
          setUserRole(roleResult.role)
        }
      } catch (error: any) {
        if (!isMounted) return

        // Check if this is an auto-cancellation error (can be ignored)
        if (error.name !== "AbortError" && error.message !== "The request was autocancelled") {
          console.error("Error fetching organization:", error)
          setError("Failed to load organization details")
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchOrganization()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [slug, user])

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" disabled>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Building2 className="mb-4 h-16 w-16 text-muted-foreground/60" />
        <h2 className="mb-2 text-2xl font-bold">{error}</h2>
        <p className="mb-6 text-muted-foreground">
          The organization you're looking for doesn't exist or you may not have the necessary permissions.
        </p>
        <Button asChild>
          <Link href="/dashboard/organizations">Back to Organizations</Link>
        </Button>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Building2 className="mb-4 h-16 w-16 text-muted-foreground/60" />
        <h2 className="mb-2 text-2xl font-bold">Organization Not Found</h2>
        <p className="mb-6 text-muted-foreground">
          The organization you're looking for doesn't exist or has been deleted.
        </p>
        <Button asChild>
          <Link href="/dashboard/organizations">Back to Organizations</Link>
        </Button>
      </div>
    )
  }

  // For public view (no user role), show a simplified view
  if (!userRole) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{organization.organization_name}</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Organization Profile</CardTitle>
            <CardDescription>Information about this organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {organization.logo && (
                <div className="flex justify-center">
                  <img
                    src={pb.getFileUrl(organization, organization.logo) || "/placeholder.svg"}
                    alt={`${organization.organization_name} logo`}
                    className="h-24 w-auto object-contain"
                  />
                </div>
              )}

              <div>
                <h3 className="text-lg font-medium">About</h3>
                <p className="text-muted-foreground">{organization.description || "No description available."}</p>
              </div>

              {organization.website && (
                <div>
                  <h3 className="text-lg font-medium">Website</h3>
                  <a
                    href={organization.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {organization.website}
                  </a>
                </div>
              )}

              {organization.address && (
                <div>
                  <h3 className="text-lg font-medium">Address</h3>
                  <p className="text-muted-foreground">{organization.address}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Display public catalogs or products if needed */}
      </div>
    )
  }

  // For members, show the full interface with tabs based on role
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/organizations">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{organization.organization_name}</h1>
      </div>

      <Tabs defaultValue="members">
        <TabsList className="mb-4">
          <TabsTrigger value="members">
            <Users className="mr-2 h-4 w-4" />
            Members
          </TabsTrigger>
          {(userRole === "admin" || userRole === "moderator") && (
            <TabsTrigger value="products">
              <Package className="mr-2 h-4 w-4" />
              Products
            </TabsTrigger>
          )}
          {(userRole === "admin" || userRole === "moderator") && (
            <TabsTrigger value="catalogs">
              <LayoutGrid className="mr-2 h-4 w-4" />
              Catalogs
            </TabsTrigger>
          )}
          {userRole === "admin" && (
            <TabsTrigger value="settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Organization Members</CardTitle>
              <CardDescription>Manage members and their roles in this organization</CardDescription>
            </CardHeader>
            <CardContent>
              <OrganizationMembersList
                organizationId={organization.id}
                userRole={userRole}
                canInviteMembers={userRole === "admin"}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {(userRole === "admin" || userRole === "moderator") && (
          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Organization Products</CardTitle>
                <CardDescription>Manage products for this organization</CardDescription>
              </CardHeader>
              <CardContent>
                <OrganizationProducts organizationId={organization.id} userRole={userRole} />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {(userRole === "admin" || userRole === "moderator") && (
          <TabsContent value="catalogs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Organization Catalogs</CardTitle>
                <CardDescription>Manage catalogs for this organization</CardDescription>
              </CardHeader>
              <CardContent>
                <OrganizationCatalogs organizationId={organization.id} userRole={userRole} />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {userRole === "admin" && (
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Organization Settings</CardTitle>
                <CardDescription>Manage your organization's details and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <OrganizationSettings organization={organization} userRole={userRole} />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
