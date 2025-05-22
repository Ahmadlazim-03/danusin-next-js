"use client"

import type React from "react"

import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { pb } from "@/lib/pocketbase"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

type Organization = {
  id: string
  organization_name: string
}

export default function NewCatalogPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const orgIdFromUrl = searchParams.get("org")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(true)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    organization: orgIdFromUrl || "",
  })

  useEffect(() => {
    let isMounted = true

    async function fetchOrganizations() {
      if (!user) return

      try {
        // Get organizations where the user is an admin or moderator
        const userOrgsResult = await pb.collection("danusin_user_organization_roles").getList(1, 100, {
          filter: `user="${user.id}" && (role="admin" || role="moderator")`,
          expand: "organization",
          $autoCancel: false,
        })

        if (!isMounted) return

        const orgs = userOrgsResult.items
          .map((item: any) => ({
            id: item.expand?.organization?.id,
            organization_name: item.expand?.organization?.organization_name,
          }))
          .filter((org: any) => org.id && org.organization_name)

        setOrganizations(orgs)

        // If no organization is selected yet but we have organizations, select the first one
        // or use the one from URL
        if ((!formData.organization || formData.organization === "") && orgs.length > 0) {
          const orgToSelect = orgIdFromUrl || orgs[0].id
          setFormData((prev) => ({
            ...prev,
            organization: orgToSelect,
          }))
        }
      } catch (error) {
        console.error("Error fetching organizations:", error)
        if (isMounted) {
          toast({
            title: "Error",
            description: "Failed to load your organizations",
            variant: "destructive",
          })
        }
      } finally {
        if (isMounted) {
          setIsLoadingOrgs(false)
        }
      }
    }

    fetchOrganizations()

    return () => {
      isMounted = false
    }
  }, [user, toast, formData.organization, orgIdFromUrl])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  const handleOrganizationChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      organization: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to create a catalog",
        variant: "destructive",
      })
      return
    }

    if (!formData.name.trim()) {
      toast({
        title: "Validation error",
        description: "Catalog name is required",
        variant: "destructive",
      })
      return
    }

    if (!formData.organization) {
      toast({
        title: "Validation error",
        description: "Please select an organization",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Create the catalog
      const catalog = await pb.collection("danusin_catalog").create({
        name: formData.name,
        description: formData.description,
        organization: formData.organization,
        created_by: user.id,
      })

      toast({
        title: "Catalog created",
        description: "Your catalog has been created successfully",
      })

      // Redirect to the catalogs page
      router.push("/dashboard/catalogs")
    } catch (error) {
      console.error("Error creating catalog:", error)
      toast({
        title: "Error",
        description: "There was an error creating your catalog. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Catalog</h1>
        <p className="text-muted-foreground">Create a new catalog for your organization</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Catalog Details</CardTitle>
            <CardDescription>Enter the details of your new catalog</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organization">Organization</Label>
              {isLoadingOrgs ? (
                <div className="h-10 w-full animate-pulse rounded-md bg-muted"></div>
              ) : organizations.length > 0 ? (
                <Select value={formData.organization} onValueChange={handleOrganizationChange} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.organization_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="rounded-md border border-dashed p-4 text-center">
                  <p className="text-sm text-muted-foreground">No organizations found.</p>
                  <Button asChild variant="link" className="mt-2 text-green-600">
                    <Link href="/dashboard/organizations/new">Create an organization</Link>
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Catalog Name</Label>
              <Input
                id="name"
                placeholder="Enter catalog name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter catalog description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/dashboard/catalogs">Cancel</Link>
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700"
              disabled={isSubmitting || !formData.organization}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Catalog"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
