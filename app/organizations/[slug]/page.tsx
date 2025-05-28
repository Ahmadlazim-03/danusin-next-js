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
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

export default function OrganizationPage() {
  const { slug } = useParams()
  // const router = useRouter() // router is initialized but not used. Consider removing if not needed.
  const { user } = useAuth()
  const [organization, setOrganization] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    const fetchOrganization = async () => {
      if (!user || !slug) {
        // If no user or slug, set loading to false and return if appropriate
        // For instance, if slug is required and not present, it might be an error or invalid state.
        if (!slug) setError("Organization slug is missing.");
        setLoading(false);
        return;
      }


      setLoading(true); // Ensure loading is true at the start of fetch
      try {
        // First, find the organization by slug
        const orgResult = await pb.collection("danusin_organization").getFirstListItem(`slug="${slug}"`, {
          signal: controller.signal,
          $autoCancel: false, // Explicitly setting, though true is default for getFirstListItem
        })

        if (!isMounted) return

        if (!orgResult) {
          setError("Organization not found")
          setOrganization(null); // Ensure organization state is cleared
          setLoading(false)
          return
        }

        setOrganization(orgResult)

        // Check user's role in this organization
        // This assumes 'user.id' and 'orgResult.id' are valid
        const roleResult = await pb
          .collection("danusin_user_organization_roles")
          .getFirstListItem(`user="${user.id}" && organization="${orgResult.id}"`, {
            signal: controller.signal,
            $autoCancel: false,
          })

        if (!isMounted) return

        if (roleResult) {
          setUserRole(roleResult.role)
        } else {
          setUserRole(null); // Explicitly set to null if no role found
        }
      } catch (error: any) {
        if (!isMounted) return

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
      <div className="space-y-8 p-4 md:p-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" disabled>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-48 md:w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-36 md:w-48" />
            <Skeleton className="h-4 w-full max-w-md" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" /> {/* For TabsList */}
              <Skeleton className="h-48 w-full" /> {/* For TabsContent */}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <Building2 className="mb-4 h-16 w-16 text-destructive/70" />
        <h2 className="mb-2 text-2xl font-bold text-destructive">{error}</h2>
        <p className="mb-6 text-muted-foreground">
          The organization you're looking for might not exist or there was an issue loading its details.
        </p>
        <Button asChild>
          <Link href="/dashboard/organizations">Back to Organizations</Link>
        </Button>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <Building2 className="mb-4 h-16 w-16 text-muted-foreground/60" />
        <h2 className="mb-2 text-2xl font-bold">Organization Not Found</h2>
        <p className="mb-6 text-muted-foreground">
          The organization with slug &quot;{slug}&quot; could not be found or may have been deleted.
        </p>
        <Button asChild>
          <Link href="/dashboard/organizations">Back to Organizations</Link>
        </Button>
      </div>
    )
  }

  // For public view (no user role, or user is not a member)
  if (!userRole) {
    return (
      <div className="space-y-8 p-4 md:p-6">
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
            <CardDescription>Public information about this organization.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {organization.logo && (
              <div className="flex justify-center mb-4">
                <img
                  src={pb.getFileUrl(organization, organization.logo, {thumb: '100x100'}) || "/placeholder.svg"}
                  alt={`${organization.organization_name} logo`}
                  className="h-24 w-24 rounded-full object-cover border"
                  onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                />
              </div>
            )}

            <div>
              <h3 className="text-lg font-medium">About</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{organization.description || "No description available."}</p>
            </div>

            {organization.website && (
              <div>
                <h3 className="text-lg font-medium mt-2">Website</h3>
                <a
                  href={organization.website.startsWith('http') ? organization.website : `https://${organization.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline break-all"
                >
                  {organization.website}
                </a>
              </div>
            )}

            {organization.address && (
              <div>
                <h3 className="text-lg font-medium mt-2">Address</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{organization.address}</p>
              </div>
            )}
          </CardContent>
        </Card>
        {/* Potentially display public products/catalogs here if applicable */}
      </div>
    )
  }

  // For members, show the full interface with tabs based on role
  return (
    <div className="space-y-8 p-4 md:p-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/organizations">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{organization.organization_name}</h1>
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="mb-4 grid w-full grid-cols-2 sm:grid-cols-4">
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
              <CardDescription>Manage members and their roles in this organization.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* The error occurs on the next line because OrganizationMembersList's props type
                  does not include 'canInviteMembers'. You need to update the
                  OrganizationMembersList component's props interface to accept this prop.
                  Example:
                  interface OrganizationMembersListProps {
                    organizationId: string;
                    userRole: string | null;
                    canInviteMembers?: boolean; // Add this line
                  }
              */}
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
                <CardDescription>Manage products for this organization.</CardDescription>
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
                <CardDescription>Manage catalogs for this organization.</CardDescription>
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
                <CardDescription>Manage your organization's details and preferences.</CardDescription>
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
