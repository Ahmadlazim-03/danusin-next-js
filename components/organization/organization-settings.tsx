"use client"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { pb } from "@/lib/pocketbase"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function OrganizationSettings({ organization, userRole }: { organization: any; userRole: string | null }) {
  const router = useRouter()
  const [name, setName] = useState(organization.organization_name)
  const [description, setDescription] = useState(organization.organization_description)
  const [slug, setSlug] = useState(organization.organization_slug)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isAdmin = userRole === "admin"

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Organization name is required",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      await pb.collection("danusin_organization").update(organization.id, {
        organization_name: name,
        organization_description: description,
        organization_slug: slug,
      })

      toast({
        title: "Success",
        description: "Organization settings updated successfully",
      })
    } catch (error) {
      console.error("Error updating organization:", error)
      toast({
        title: "Error",
        description: "Failed to update organization settings",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }
  const handleDelete = async () => {
    setIsDeleting(true)
  
    try {
      // Step 1: Fetch and delete related records in danusin_user_organization_roles
      const relatedRoles = await pb
        .collection("danusin_user_organization_roles")
        .getList(1, 50, {
          filter: `organization = "${organization.id}"`,
        })
  
      // Step 2: Delete each related role record
      for (const role of relatedRoles.items) {
        await pb.collection("danusin_user_organization_roles").delete(role.id)
      }
  
      // Step 3: Delete the organization
      await pb.collection("danusin_organization").delete(organization.id)
  
      toast({
        title: "Success",
        description: "Organization and related roles deleted successfully",
      })
  
      router.push("/dashboard/organizations")
    } catch (error) {
      console.error("Error deleting organization or related roles:", error)
      toast({
        title: "Error",
        description: "Failed to delete organization or related roles",
        variant: "destructive",
      })
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Organization Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={!isAdmin} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!isAdmin}
            rows={4}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">URL Slug</Label>
          <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} disabled={!isAdmin} />
          <p className="text-xs text-muted-foreground">
            This will be used in the URL: danusin.com/organizations/{slug}
          </p>
        </div>
      </div>

      <div className="flex justify-between">
        <Button onClick={handleSave} disabled={isSaving || !isAdmin} className="bg-green-600 hover:bg-green-700">
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>

        {isAdmin && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete Organization</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the organization and remove all associated
                  data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  )
}
