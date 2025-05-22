"use client"

import { useAuth } from "@/components/auth/auth-provider"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { pb } from "@/lib/pocketbase"
import { LayoutGrid, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"

type Catalog = {
  id: string
  name: string
  description: string
  created: string
  created_by: string
  products?: number
}

type OrganizationCatalogsProps = {
  organizationId: string
  userRole: string | null
}

export function OrganizationCatalogs({ organizationId, userRole }: OrganizationCatalogsProps) {
  const { user } = useAuth()
  const [catalogs, setCatalogs] = useState<Catalog[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedCatalog, setSelectedCatalog] = useState<Catalog | null>(null)

  // Form state
  const [catalogName, setCatalogName] = useState("")
  const [catalogDescription, setCatalogDescription] = useState("")

  const canManageCatalogs = userRole === "admin" || userRole === "moderator"

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    const fetchCatalogs = async () => {
      try {
        // First, get all products for this organization
        const productsResult = await pb.collection("danusin_product").getList(1, 500, {
          filter: `by_organization="${organizationId}"`,
          signal: controller.signal,
        })

        if (!isMounted) return

        // Extract unique catalog IDs from products
        const catalogIds = [...new Set(productsResult.items.map((product) => product.catalog))].filter(Boolean)

        if (catalogIds.length === 0) {
          setCatalogs([])
          setLoading(false)
          return
        }

        // Count products per catalog
        const productCountByCategory: Record<string, number> = {}
        productsResult.items.forEach((product) => {
          if (product.catalog) {
            productCountByCategory[product.catalog] = (productCountByCategory[product.catalog] || 0) + 1
          }
        })

        // Fetch the actual catalogs
        const catalogsData: Catalog[] = []

        for (const catalogId of catalogIds) {
          try {
            const catalog = await pb.collection("danusin_catalog").getOne(catalogId)
            catalogsData.push({
              ...catalog,
              products: productCountByCategory[catalogId] || 0,
            })
          } catch (err) {
            console.error(`Error fetching catalog ${catalogId}:`, err)
          }
        }

        if (!isMounted) return
        setCatalogs(catalogsData)
      } catch (error: any) {
        if (error.name !== "AbortError" && error.message !== "The request was autocancelled") {
          console.error("Error fetching catalogs:", error)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchCatalogs()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [organizationId])

  const resetForm = () => {
    setCatalogName("")
    setCatalogDescription("")
    setSelectedCatalog(null)
  }

  const handleAddCatalog = async () => {
    if (!catalogName.trim() || !user) {
      toast({
        title: "Error",
        description: "Please enter a catalog name",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Create the catalog
      const newCatalog = await pb.collection("danusin_catalog").create({
        name: catalogName,
        description: catalogDescription,
        created_by: user.id,
      })

      // 2. Create a product in this catalog that belongs to the organization
      // This establishes the relationship between catalog and organization
      await pb.collection("danusin_product").create({
        product_name: `${catalogName} Sample Product`,
        catalog: newCatalog.id,
        by_organization: organizationId,
        added_by: user.id,
        price: 0,
        discount: 0,
        slug: `${catalogName.toLowerCase().replace(/\s+/g, "-")}-sample`,
        product_image: [],
      })

      // Add the new catalog to the list
      setCatalogs([
        ...catalogs,
        {
          ...newCatalog,
          products: 1,
        },
      ])

      toast({
        title: "Success",
        description: "Catalog added successfully",
      })

      resetForm()
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error("Error adding catalog:", error)
      toast({
        title: "Error",
        description: "Failed to add catalog. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditCatalog = async () => {
    if (!selectedCatalog || !catalogName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a catalog name",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const updatedCatalog = await pb.collection("danusin_catalog").update(selectedCatalog.id, {
        name: catalogName,
        description: catalogDescription,
      })

      // Update the catalog in the list
      setCatalogs(
        catalogs.map((catalog) =>
          catalog.id === selectedCatalog.id ? { ...updatedCatalog, products: catalog.products } : catalog,
        ),
      )

      toast({
        title: "Success",
        description: "Catalog updated successfully",
      })

      resetForm()
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error("Error updating catalog:", error)
      toast({
        title: "Error",
        description: "Failed to update catalog. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCatalog = async (catalogId: string) => {
    try {
      // Check if there are products in this catalog
      const productsResult = await pb.collection("danusin_product").getList(1, 1, {
        filter: `catalog="${catalogId}" && by_organization="${organizationId}"`,
      })

      if (productsResult.totalItems > 0) {
        toast({
          title: "Error",
          description: "Cannot delete catalog with products. Remove all products first.",
          variant: "destructive",
        })
        return
      }

      await pb.collection("danusin_catalog").delete(catalogId)

      // Remove the catalog from the list
      setCatalogs(catalogs.filter((catalog) => catalog.id !== catalogId))

      toast({
        title: "Success",
        description: "Catalog deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting catalog:", error)
      toast({
        title: "Error",
        description: "Failed to delete catalog. Please try again.",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (catalog: Catalog) => {
    setSelectedCatalog(catalog)
    setCatalogName(catalog.name)
    setCatalogDescription(catalog.description)
    setIsEditDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded" />
              <div>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-1 h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {canManageCatalogs && (
        <div className="flex justify-end">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="mr-2 h-4 w-4" />
                Add Catalog
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Catalog</DialogTitle>
                <DialogDescription>Create a new catalog for your organization.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Catalog Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter catalog name"
                    value={catalogName}
                    onChange={(e) => setCatalogName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter catalog description"
                    value={catalogDescription}
                    onChange={(e) => setCatalogDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    resetForm()
                    setIsAddDialogOpen(false)
                  }}
                >
                  Cancel
                </Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={handleAddCatalog} disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Catalog"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Catalog</DialogTitle>
                <DialogDescription>Update the details of your catalog.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Catalog Name</Label>
                  <Input
                    id="edit-name"
                    placeholder="Enter catalog name"
                    value={catalogName}
                    onChange={(e) => setCatalogName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    placeholder="Enter catalog description"
                    value={catalogDescription}
                    onChange={(e) => setCatalogDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    resetForm()
                    setIsEditDialogOpen(false)
                  }}
                >
                  Cancel
                </Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={handleEditCatalog} disabled={isSubmitting}>
                  {isSubmitting ? "Updating..." : "Update Catalog"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {catalogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <LayoutGrid className="mb-4 h-16 w-16 text-muted-foreground/60" />
          <h3 className="mb-1 text-lg font-medium">No catalogs yet</h3>
          <p className="mb-6 max-w-sm text-sm text-muted-foreground">Create catalogs to organize your products.</p>
          {canManageCatalogs && (
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Catalog
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {catalogs.map((catalog) => (
            <div key={catalog.id} className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-1">
                <h4 className="font-medium">{catalog.name}</h4>
                <p className="text-sm text-muted-foreground">{catalog.description}</p>
                <p className="text-xs text-muted-foreground">
                  {catalog.products} {catalog.products === 1 ? "product" : "products"}
                </p>
              </div>
              {canManageCatalogs && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(catalog)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-500">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the catalog "{catalog.name}". This action cannot be undone.
                            Note: You cannot delete catalogs that contain products.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-500 hover:bg-red-600"
                            onClick={() => handleDeleteCatalog(catalog.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
