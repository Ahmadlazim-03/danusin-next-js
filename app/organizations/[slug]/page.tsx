"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { pb } from "@/lib/pocketbase"
import { ArrowLeft, Building2, LayoutGrid, Package } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

export default function OrganizationPage() {
  const { slug } = useParams()
  const [organization, setOrganization] = useState<any>(null)
  const [catalogs, setCatalogs] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchOrganization = async () => {
      if (!slug) return

      try {
        // Fetch organization by slug
        const orgResult = await pb.collection("danusin_organization").getFirstListItem(`organization_slug="${slug}"`)

        if (!isMounted) return

        setOrganization(orgResult)

        // Fetch catalogs for this organization
        const catalogsResult = await pb.collection("danusin_catalog").getList(1, 20, {
          filter: `organization="${orgResult.id}"`,
        })

        if (!isMounted) return

        setCatalogs(catalogsResult.items)

        // Fetch products for this organization
        const productsResult = await pb.collection("danusin_product").getList(1, 20, {
          filter: `organization="${orgResult.id}"`,
        })

        if (!isMounted) return

        setProducts(productsResult.items)
      } catch (error: any) {
        if (!isMounted) return

        // Check if this is an auto-cancellation error (can be ignored)
        if (error.name !== "AbortError" && error.message !== "The request was autocancelled") {
          console.error("Error fetching organization:", error)
          setError("Organization not found")
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchOrganization()

    return () => {
      isMounted = false
    }
  }, [slug])

  if (loading) {
    return (
      <div className="container mx-auto p-4 space-y-8">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" disabled>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="flex flex-col md:flex-row gap-6">
          <Skeleton className="h-48 w-full md:w-1/3" />
          <div className="space-y-4 w-full md:w-2/3">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !organization) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Building2 className="mb-4 h-16 w-16 text-muted-foreground/60" />
          <h2 className="mb-2 text-2xl font-bold">Organization Not Found</h2>
          <p className="mb-6 text-muted-foreground">
            The organization you're looking for doesn't exist or has been deleted.
          </p>
          <Button asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{organization.organization_name}</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/3">
          <Card>
            <CardContent className="p-4">
              <div className="aspect-square overflow-hidden rounded-lg">
                <Image
                  src={organization.organization_image || "/placeholder.svg?height=400&width=400"}
                  alt={organization.organization_name}
                  width={400}
                  height={400}
                  className="h-full w-full object-cover"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full md:w-2/3">
          <Card>
            <CardHeader>
              <CardTitle>{organization.organization_name}</CardTitle>
              <CardDescription>{organization.organization_description || "No description available"}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="catalogs">
                <TabsList>
                  <TabsTrigger value="catalogs">
                    <LayoutGrid className="mr-2 h-4 w-4" />
                    Catalogs
                  </TabsTrigger>
                  <TabsTrigger value="products">
                    <Package className="mr-2 h-4 w-4" />
                    Products
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="catalogs" className="space-y-4 mt-4">
                  {catalogs.length === 0 ? (
                    <div className="text-center py-8">
                      <LayoutGrid className="mx-auto h-12 w-12 text-muted-foreground/60" />
                      <p className="mt-2 text-muted-foreground">No catalogs available</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {catalogs.map((catalog) => (
                        <Card key={catalog.id}>
                          <CardHeader className="p-4">
                            <CardTitle className="text-lg">{catalog.name}</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <p className="text-sm text-muted-foreground">
                              {catalog.description || "No description available"}
                            </p>
                            <Button asChild className="mt-4" variant="outline">
                              <Link href={`/catalogs/${catalog.id}`}>View Catalog</Link>
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="products" className="space-y-4 mt-4">
                  {products.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="mx-auto h-12 w-12 text-muted-foreground/60" />
                      <p className="mt-2 text-muted-foreground">No products available</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {products.map((product) => (
                        <Card key={product.id}>
                          <CardHeader className="p-4">
                            <CardTitle className="text-lg">{product.name}</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <p className="text-sm text-muted-foreground">
                              {product.description || "No description available"}
                            </p>
                            <Button asChild className="mt-4" variant="outline">
                              <Link href={`/products/${product.id}`}>View Product</Link>
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
