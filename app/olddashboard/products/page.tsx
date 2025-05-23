"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { pb } from "@/lib/pocketbase"
import { Building2, Package, Plus, Search } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

type Product = {
  id: string
  name: string
  description: string
  price: number
  image: string
  catalog: string
  catalog_name?: string
  organization?: string
  organization_name?: string
  added_by: string
}

type Organization = {
  id: string
  organization_name: string
}

export default function ProductsPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrg, setSelectedOrg] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    async function fetchUserOrganizations() {
      if (!user) return

      try {
        // Get organizations where user has admin or moderator role
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

        // Set default selected organization if available
        if (orgs.length > 0) {
          setSelectedOrg(orgs[0].id)
        }
      } catch (error) {
        console.error("Error fetching organizations:", error)
      }
    }

    fetchUserOrganizations()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [user])

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    async function fetchProducts() {
      if (!user || !selectedOrg) {
        setLoading(false)
        return
      }

      try {
        // Get catalogs for the selected organization
        const catalogsResult = await pb.collection("danusin_catalog").getList(1, 100, {
          filter: `organization="${selectedOrg}"`,
          $autoCancel: false,
        })

        if (!isMounted) return

        if (catalogsResult.items.length === 0) {
          setProducts([])
          setLoading(false)
          return
        }

        const catalogIds = catalogsResult.items.map((catalog: any) => catalog.id)
        const catalogIdFilter =
          catalogIds.length === 1 ? `catalog="${catalogIds[0]}"` : `catalog IN ["${catalogIds.join('","')}"]`

        // Get products for these catalogs
        const productsResult = await pb.collection("danusin_product").getList(1, 50, {
          filter: catalogIdFilter,
          expand: "catalog",
          $autoCancel: false,
        })

        if (!isMounted) return

        // Process products to include catalog names
        const processedProducts = productsResult.items.map((product: any) => {
          // Get image URL if available
          let imageUrl = ""
          if (product.image) {
            imageUrl = pb.files.getUrl(product, product.image)
          }

          return {
            ...product,
            image: imageUrl,
            catalog_name: product.expand?.catalog?.name || "Unknown Catalog",
            organization: selectedOrg,
            organization_name:
              organizations.find((org) => org.id === selectedOrg)?.organization_name || "Unknown Organization",
          }
        })

        setProducts(processedProducts as unknown as Product[])
      } catch (error) {
        console.error("Error fetching products:", error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    setLoading(true)
    fetchProducts()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [user, selectedOrg, organizations])

  // Filter products based on search query
  const filteredProducts = searchQuery
    ? products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.catalog_name?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : products

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your organization's products</p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {organizations.length > 0 && (
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link href={`/dashboard/products/new?org=${selectedOrg}`}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Link>
            </Button>
          )}
        </div>
      </div>

      {organizations.length > 0 ? (
        <div className="flex items-center gap-4">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <Select value={selectedOrg} onValueChange={setSelectedOrg}>
            <SelectTrigger className="w-[250px]">
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
        </div>
      ) : (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <p className="text-amber-800">You need to create an organization first before you can manage products.</p>
            <Button asChild className="mt-2 bg-amber-600 hover:bg-amber-700">
              <Link href="/dashboard/organizations/new">Create Organization</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-video w-full">
                <Skeleton className="h-full w-full" />
              </div>
              <CardContent className="p-4">
                <Skeleton className="mb-2 h-6 w-2/3" />
                <Skeleton className="mb-4 h-4 w-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-green-300 bg-white p-12 text-center">
          <Package className="mb-4 h-12 w-12 text-green-300" />
          <h2 className="mb-2 text-xl font-semibold">No Products Found</h2>
          <p className="mb-6 max-w-md text-muted-foreground">
            {searchQuery
              ? "No products match your search criteria. Try a different search term."
              : selectedOrg
                ? "This organization doesn't have any products yet. Add your first product to start selling."
                : "Select an organization to view its products."}
          </p>
          {selectedOrg && !searchQuery && (
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link href={`/dashboard/products/new?org=${selectedOrg}`}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="aspect-video relative w-full bg-muted">
                {product.image ? (
                  <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Package className="h-12 w-12 text-muted-foreground/40" />
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="font-medium">{product.name}</h3>
                  <span className="font-semibold text-green-700">${product.price.toFixed(2)}</span>
                </div>
                <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{product.catalog_name}</Badge>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href={`/dashboard/products/${product.id}?org=${product.organization}`}>View</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href={`/dashboard/products/${product.id}/edit?org=${product.organization}`}>Edit</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
