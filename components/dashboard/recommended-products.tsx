"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { pb } from "@/lib/pocketbase"
import { ExternalLink } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

type Product = {
  id: string
  name: string
  description: string
  price: number
  discount_price: number
  image: string
  organization: {
    id: string
    organization_name: string
    organization_slug: string
  }
}

export function RecommendedProducts() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const cancelTokensRef = useRef<string[]>([])
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
      // Cancel all pending requests on unmount
      cancelTokensRef.current.forEach((token) => {
        pb.cancelRequest(token)
      })
    }
  }, [])

  useEffect(() => {
    // Clear previous cancel tokens
    cancelTokensRef.current.forEach((token) => {
      pb.cancelRequest(token)
    })
    cancelTokensRef.current = []

    async function fetchRecommendedProducts() {
      try {
        const productsCancelToken = `recommended_products_${Date.now()}`
        cancelTokensRef.current.push(productsCancelToken)

        // Fetch the latest products with organization expand
        const result = await pb.collection("danusin_product").getList(1, 6, {
          sort: "-created",
          expand: "organization",
          $autoCancel: false,
          $cancelKey: productsCancelToken,
        })

        if (!isMountedRef.current) return

        // Transform the data to include organization details
        const productsWithOrg = result.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          discount_price: item.discount_price,
          image: item.image,
          organization: item.expand?.organization
            ? {
                id: item.expand.organization.id,
                organization_name: item.expand.organization.organization_name,
                organization_slug: item.expand.organization.organization_slug,
              }
            : null,
        }))

        setProducts(productsWithOrg)
      } catch (error: any) {
        // Only log errors that aren't related to cancellation
        if (error.name !== "AbortError" && error.message !== "The request was autocancelled") {
          console.error("Error fetching recommended products:", error)
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false)
        }
      }
    }

    fetchRecommendedProducts()
  }, [])

  return (
    <Card className="border-green-100 bg-white">
      <CardHeader className="pb-0">
        <h2 className="text-xl font-bold">Recommended Products</h2>
        <p className="text-sm text-muted-foreground">Discover the latest products from our community</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-lg border p-3">
                <Skeleton className="h-40 w-full rounded-md mb-3" />
                <Skeleton className="h-5 w-2/3 mb-2" />
                <Skeleton className="h-4 w-full mb-3" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No products available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <div key={product.id} className="rounded-lg border overflow-hidden flex flex-col">
                <div className="h-40 relative">
                  <Image
                    src={product.image || "/placeholder.svg?height=160&width=320"}
                    alt={product.name || "EVOP PRODUCT"}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <h3 className="font-medium mb-1 line-clamp-1">{product.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2 flex-1">{product.description}</p>

                  {product.organization && (
                    <div className="mb-2">
                      <Badge variant="outline" className="text-xs">
                        {product.organization.organization_name}
                      </Badge>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div>
                      {product.discount_price ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">${product.discount_price.toFixed(2)}</span>
                          <span className="text-xs text-muted-foreground line-through">
                            ${product.price.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm font-bold">${product.price.toFixed(2)}</span>
                      )}
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dashboard/products/${product.id}`}>
                        <ExternalLink className="h-3 w-3 mr-1" /> View
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
