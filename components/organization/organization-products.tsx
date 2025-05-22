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
import { Badge } from "@/components/ui/badge"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { pb } from "@/lib/pocketbase"
import { MoreHorizontal, Package, Pencil, Plus, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"

type Product = {
  id: string
  name: string
  description: string
  price: number
  catalog: string
  catalogName?: string
  created: string
}

export function OrganizationProducts({
  organizationId,
  userRole,
}: {
  organizationId: string
  userRole: string | null
}) {
  const [products, setProducts] = useState<Product[]>([])
  const [catalogs, setCatalogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Form state
  const [productName, setProductName] = useState("")
  const [productDescription, setProductDescription] = useState("")
  const [productPrice, setProductPrice] = useState("")
  const [productCatalog, setProductCatalog] = useState("")

  const canManageProducts = userRole === "admin" || userRole === "moderator"

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    const fetchData = async () => {
      try {
        // Fetch catalogs first
        const catalogsResult = await pb.collection("danusin_catalog").getList(1, 100, {
          filter: `organization="${organizationId}"`,
          signal: controller.signal,
          $autoCancel: false,
        })

        if (!isMounted) return

        setCatalogs(catalogsResult.items)

        // Then fetch products
        const productsResult = await pb.collection("danusin_product").getList(1, 100, {
          filter: `organization="${organizationId}"`,
          signal: controller.signal,
          $autoCancel: false,
        })

        if (!isMounted) return

        // Map catalog names to products
        const productsWithCatalogNames = productsResult.items.map((product: any) => {
          const catalog = catalogsResult.items.find((cat: any) => cat.id === product.catalog)
          return {
            ...product,
            catalogName: catalog ? catalog.name : "Unknown Catalog",
          }
        })

        setProducts(productsWithCatalogNames)
      } catch (error: any) {
        if (error.name !== "AbortError" && error.message !== "The request was autocancelled") {
          console.error("Error fetching products:", error)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [organizationId])

  const resetForm = () => {
    setProductName("")
    setProductDescription("")
    setProductPrice("")
    setProductCatalog("")
    setSelectedProduct(null)
  }

  const handleAddProduct = async () => {
    if (!productName.trim() || !productCatalog || !productPrice) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const newProduct = await pb.collection("danusin_product").create({
        name: productName,
        description: productDescription,
        price: Number.parseFloat(productPrice),
        catalog: productCatalog,
        organization: organizationId,
      })

      // Find catalog name
      const catalog = catalogs.find((cat) => cat.id === productCatalog)

      // Add the new product to the list
      setProducts([
        ...products,
        {
          id: newProduct.id,
          name: newProduct.name,
          description: newProduct.description,
          price: newProduct.price,
          catalog: newProduct.catalog,
          catalogName: catalog ? catalog.name : "Unknown Catalog",
          created: newProduct.created,
        },
      ])

      toast({
        title: "Success",
        description: "Product added successfully",
      })

      resetForm()
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error("Error adding product:", error)
      toast({
        title: "Error",
        description: "Failed to add product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditProduct = async () => {
    if (!selectedProduct || !productName.trim() || !productCatalog || !productPrice) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const updatedProduct = await pb.collection("danusin_product").update(selectedProduct.id, {
        name: productName,
        description: productDescription,
        price: Number.parseFloat(productPrice),
        catalog: productCatalog,
      })

      // Find catalog name
      const catalog = catalogs.find((cat) => cat.id === productCatalog)

      // Update the product in the list
      setProducts(
        products.map((product) =>
          product.id === selectedProduct.id
            ? {
                ...updatedProduct,
                catalogName: catalog ? catalog.name : "Unknown Catalog",
              }
            : product,
        ),
      )

      toast({
        title: "Success",
        description: "Product updated successfully",
      })

      resetForm()
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error("Error updating product:", error)
      toast({
        title: "Error",
        description: "Failed to update product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    try {
      await pb.collection("danusin_product").delete(productId)

      // Remove the product from the list
      setProducts(products.filter((product) => product.id !== productId))

      toast({
        title: "Success",
        description: "Product deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product)
    setProductName(product.name)
    setProductDescription(product.description)
    setProductPrice(product.price.toString())
    setProductCatalog(product.catalog)
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
      {canManageProducts && (
        <div className="flex justify-end">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>Create a new product for your organization.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter product name"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter product description"
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="0.00"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="catalog">Catalog</Label>
                  <Select value={productCatalog} onValueChange={setProductCatalog}>
                    <SelectTrigger id="catalog">
                      <SelectValue placeholder="Select a catalog" />
                    </SelectTrigger>
                    <SelectContent>
                      {catalogs.length > 0 ? (
                        catalogs.map((catalog) => (
                          <SelectItem key={catalog.id} value={catalog.id}>
                            {catalog.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No catalogs available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
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
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleAddProduct}
                  disabled={isSubmitting || catalogs.length === 0}
                >
                  {isSubmitting ? "Adding..." : "Add Product"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Product</DialogTitle>
                <DialogDescription>Update the details of your product.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Product Name</Label>
                  <Input
                    id="edit-name"
                    placeholder="Enter product name"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    placeholder="Enter product description"
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Price</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    placeholder="0.00"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-catalog">Catalog</Label>
                  <Select value={productCatalog} onValueChange={setProductCatalog}>
                    <SelectTrigger id="edit-catalog">
                      <SelectValue placeholder="Select a catalog" />
                    </SelectTrigger>
                    <SelectContent>
                      {catalogs.map((catalog) => (
                        <SelectItem key={catalog.id} value={catalog.id}>
                          {catalog.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <Button className="bg-green-600 hover:bg-green-700" onClick={handleEditProduct} disabled={isSubmitting}>
                  {isSubmitting ? "Updating..." : "Update Product"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Package className="mb-4 h-16 w-16 text-muted-foreground/60" />
          <h3 className="mb-1 text-lg font-medium">No products yet</h3>
          <p className="mb-6 max-w-sm text-sm text-muted-foreground">Add products to showcase in your organization.</p>
          {canManageProducts && (
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <div key={product.id} className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{product.name}</h4>
                  <Badge variant="outline">{product.catalogName}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{product.description}</p>
                <p className="text-sm font-medium">${product.price.toFixed(2)}</p>
              </div>
              {canManageProducts && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(product)}>
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
                            This will permanently delete the product "{product.name}". This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-500 hover:bg-red-600"
                            onClick={() => handleDeleteProduct(product.id)}
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
