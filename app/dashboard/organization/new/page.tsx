"use client"

import type React from "react"

import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { pb } from "@/lib/pocketbase"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function NewOrganizationPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    organization_name: "",
    organization_description: "",
    target: 0,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: id === "target" ? Number.parseFloat(value) || 0 : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to create an organization",
        variant: "destructive",
      })
      return
    }

    if (!formData.organization_name.trim()) {
      toast({
        title: "Validation error",
        description: "Organization name is required",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Generate a slug from the organization name
      const slug = formData.organization_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")

      // Create the organization
      const organization = await pb.collection("danusin_organization").create({
        organization_name: formData.organization_name,
        organization_description: formData.organization_description,
        organization_slug: slug,
        target: formData.target,
        target_progress: 0,
        created_by: user.id,
      })

      // Add the user as an admin of the organization
      await pb.collection("danusin_user_organization_roles").create({
        user: user.id,
        organization: organization.id,
        role: "admin",
      })

      toast({
        title: "Organization created",
        description: "Your organization has been created successfully",
      })

      // Redirect to the organizations page
      router.push("/dashboard/organizations")
    } catch (error) {
      console.error("Error creating organization:", error)
      toast({
        title: "Error",
        description: "There was an error creating your organization. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Organization</h1>
        <p className="text-muted-foreground">Create a new organization to manage catalogs and products</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
            <CardDescription>Enter the details of your new organization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organization_name">Organization Name</Label>
              <Input
                id="organization_name"
                placeholder="Enter organization name"
                value={formData.organization_name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization_description">Description</Label>
              <Textarea
                id="organization_description"
                placeholder="Enter organization description"
                rows={4}
                value={formData.organization_description}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target">Fundraising Target ($)</Label>
              <Input
                id="target"
                type="number"
                placeholder="Enter fundraising target"
                value={formData.target || ""}
                onChange={handleChange}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/dashboard/organizations">Cancel</Link>
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Organization"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
