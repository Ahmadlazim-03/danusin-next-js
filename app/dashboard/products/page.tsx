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
  catalog: string
  catalog_name?: string
  added_by: string
}

export default function ProductsPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    let isMounted = true

    async function fetchProducts() {
      if (!user) return

      try {
        // Get products added by the user
        const productsResult = await pb.collection("danusin_product").getList(1, 50, {
          filter: `added_by="${user.id}"`,
          expand: "catalog",
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
          }
        })

        setProducts(processedProducts as unknown as Product[])
      } catch (error: any) {
        // Check if this is an auto-cancellation error (can be ignored)
        if (error.name !== "AbortError" && error.message !== "The request was autocancelled") {
          console.error("Error fetching products:", error)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchProducts()

    // Cleanup function to prevent setting state after unmount
    return () => {
      isMounted = false
    }
  }, [user])

  // Filter products based on search query
  const filteredProducts = searchQuery
    ? products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.catalog_name?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : products

  // Check if user can add products (is a danuser)
  const canAddProducts = user?.isdanuser

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
                  <Badge variant="outline">{product.catalog_name}</Badge>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href={`/dashboard/products/${product.id}`}>View</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href={`/dashboard/products/${product.id}/edit`}>Edit</Link>
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
