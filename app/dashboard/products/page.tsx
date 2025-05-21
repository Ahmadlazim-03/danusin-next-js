"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { pb } from "@/lib/pocketbase"
import { Package, Plus, Search } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

type Product = {
  id: string
  name: string
  description: string
  price: number
  image: string
  organization: string
  catalog: string
  organization_name?: string
  catalog_name?: string
}

type UserRole = {
  organization: string
  role: "admin" | "moderator" | "member"
}

export default function ProductsPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [userRoles, setUserRoles] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function fetchProducts() {
      if (!user) return

      try {
        // Get user roles for organizations
        const userOrgsResult = await pb.collection("danusin_user_organization_roles").getList(1, 100, {
          filter: `user="${user.id}"`,
        })

        // Create a map of organization IDs to roles
        const roles = userOrgsResult.items.reduce((acc: Record<string, string>, item: any) => {
          if (item.organization && item.role) {
            acc[item.organization] = item.role
          }
          return acc
        }, {})

        setUserRoles(roles)

        // Get organizations the user is a member of
        const orgIds = userOrgsResult.items.map((item: any) => item.organization).filter(Boolean)

        if (orgIds.length === 0) {
          setProducts([])
          setLoading(false)
          return
        }

        // Get products for these organizations
        const productsResult = await pb.collection("danusin_product").getList(1, 50, {
          filter: orgIds.map((id) => `organization="${id}"`).join(" || "),
          expand: "organization,catalog",
        })

        // Process products to include organization and catalog names
        const processedProducts = productsResult.items.map((product: any) => {
          // Get image URL if available
          let imageUrl = ""
          if (product.image) {
            imageUrl = pb.files.getUrl(product, product.image)
          }

          return {
            ...product,
            image: imageUrl,
            organization_name: product.expand?.organization?.organization_name || "Unknown Organization",
            catalog_name: product.expand?.catalog?.name || "Unknown Catalog",
          }
        })

        setProducts(processedProducts as unknown as Product[])
      } catch (error) {
        console.error("Error fetching products:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [user])

  // Filter products based on search query
  const filteredProducts = searchQuery
    ? products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.organization_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.catalog_name?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : products

  // Check if user can add products (is admin or moderator of at least one organization)
  const canAddProducts = Object.values(userRoles).some((role) => role === "admin" || role === "moderator")

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your products</p>
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
          {canAddProducts && (
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link href="/dashboard/products/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Link>
            </Button>
          )}
        </div>
      </div>

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
              : canAddProducts
                ? "Add your first product to start selling."
                : "You don't have access to any products yet."}
          </p>
          {canAddProducts && !searchQuery && (
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link href="/dashboard/products/new">
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
                  <Badge variant="outline">{product.organization_name}</Badge>
                  <Badge variant="outline">{product.catalog_name}</Badge>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href={`/dashboard/products/${product.id}`}>View</Link>
                  </Button>
                  {(userRoles[product.organization] === "admin" || userRoles[product.organization] === "moderator") && (
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link href={`/dashboard/products/${product.id}/edit`}>Edit</Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
