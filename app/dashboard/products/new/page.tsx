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
import { Loader2, Upload } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

type Organization = {
  id: string
  organization_name: string
}

type Catalog = {
  id: string
  name: string
}

export default function NewProductPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [catalogs, setCatalogs] = useState<Catalog[]>([])
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(true)
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(false)
  const [productImage, setProductImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    catalog: "",
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
        })

        if (!isMounted) return

        const orgs = userOrgsResult.items
          .map((item: any) => ({
            id: item.expand?.organization?.id,
            organization_name: item.expand?.organization?.organization_name,
          }))
          .filter((org: any) => org.id && org.organization_name)

        setOrganizations(orgs)
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

    async function fetchCatalogs() {
      if (!user) return

      try {
        setIsLoadingCatalogs(true)
        // Get catalogs created by the user
        const catalogsResult = await pb.collection("danusin_catalog").getList(1, 100, {
          filter: `created_by="${user.id}"`,
        })

        if (!isMounted) return

        setCatalogs(catalogsResult.items as unknown as Catalog[])
      } catch (error) {
        console.error("Error fetching catalogs:", error)
      } finally {
        if (isMounted) {
          setIsLoadingCatalogs(false)
        }
      }
    }

    fetchOrganizations()
    fetchCatalogs()

    return () => {
      isMounted = false
    }
  }, [user, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: id === "price" ? Number.parseFloat(value) || 0 : value,
    }))
  }

  const handleCatalogChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      catalog: value,
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive",
      })
      return
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      })
      return
    }

    setProductImage(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to add a product",
        variant: "destructive",
      })
      return
    }

    if (!formData.name.trim()) {
      toast({
        title: "Validation error",
        description: "Product name is required",
        variant: "destructive",
      })
      return
    }

    if (!formData.catalog) {
      toast({
        title: "Validation error",
        description: "Please select a catalog",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const productData = new FormData()
      productData.append("name", formData.name)
      productData.append("description", formData.description)
      productData.append("price", formData.price.toString())
      productData.append("catalog", formData.catalog)
      productData.append("added_by", user.id)

      if (productImage) {
        productData.append("image", productImage)
      }

      // Create the product
      await pb.collection("danusin_product").create(productData)

      toast({
        title: "Product added",
        description: "Your product has been added successfully",
      })

      // Redirect to the products page
      router.push("/dashboard/products")
    } catch (error) {
      console.error("Error adding product:", error)
      toast({
        title: "Error",
        description: "There was an error adding your product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Product</h1>
        <p className="text-muted-foreground">Add a new product to your catalog</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
            <CardDescription>Enter the details of your new product</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="catalog">Catalog</Label>
              {isLoadingCatalogs ? (
                <div className="h-10 w-full animate-pulse rounded-md bg-muted"></div>
              ) : catalogs.length > 0 ? (
                <Select value={formData.catalog} onValueChange={handleCatalogChange} required>
                  <SelectTrigger>
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
              ) : (
                <div className="rounded-md border border-dashed p-4 text-center">
                  <p className="text-sm text-muted-foreground">No catalogs found.</p>
                  <Button asChild variant="link" className="mt-2 text-green-600">
                    <Link href="/dashboard/catalogs/new">Create a catalog</Link>
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                placeholder="Enter product name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter product description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter product price"
                value={formData.price || ""}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Product Image</Label>
              <div className="mt-2 flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative h-24 w-24 overflow-hidden rounded-md border">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Product preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-md border border-dashed">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <Input id="image" type="file" accept="image/*" onChange={handleImageChange} />
                  <p className="mt-1 text-xs text-muted-foreground">Upload a product image (max 5MB)</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/dashboard/products">Cancel</Link>
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700"
              disabled={isSubmitting || !formData.catalog}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Product"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
