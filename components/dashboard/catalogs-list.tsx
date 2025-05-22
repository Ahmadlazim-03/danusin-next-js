"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { usePocketBaseQuery } from "@/hooks/use-pocketbase-query"
import { LayoutGrid, Plus, Settings } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

type Catalog = {
  id: string
  name: string
  description: string
  created: string
  created_by: string
  organization_name?: string
  by_organization?: any
}

export function CatalogsList() {
  const { user, isDanuser } = useAuth()
  const [catalogs, setCatalogs] = useState<Catalog[]>([])
  const [loading, setLoading] = useState(true)

  // Use the custom hook to fetch catalogs created by the user
  const { data: createdCatalogsData, isLoading: isLoadingCreated } = usePocketBaseQuery({
    collection: "danusin_catalog",
    queryParams: {
      filter: user ? `created_by="${user.id}"` : "",
    },
    enabled: !!user && isDanuser,
  })

  // Use the custom hook to fetch catalogs the user has access to
  const { data: catalogAccessData, isLoading: isLoadingAccess } = usePocketBaseQuery({
    collection: "danusin_catalog_user",
    queryParams: {
      filter: user ? `user_id="${user.id}"` : "",
      expand: "catalog_id",
    },
    enabled: !!user,
  })

  useEffect(() => {
    if (!user || (isLoadingCreated && isDanuser) || isLoadingAccess) {
      return
    }

    setLoading(true)

    try {
      const allCatalogs: Catalog[] = []

      // Add catalogs created by the user
      if (createdCatalogsData && createdCatalogsData.items) {
        allCatalogs.push(...createdCatalogsData.items)
      }

      // Add catalogs the user has access to
      if (catalogAccessData && catalogAccessData.items) {
        catalogAccessData.items.forEach((access: any) => {
          if (access.expand?.catalog_id && !allCatalogs.some((c) => c.id === access.expand.catalog_id.id)) {
            allCatalogs.push(access.expand.catalog_id)
          }
        })
      }

      setCatalogs(allCatalogs)
    } catch (error) {
      console.error("Error processing catalogs:", error)
    } finally {
      setLoading(false)
    }
  }, [user, createdCatalogsData, catalogAccessData, isLoadingCreated, isLoadingAccess, isDanuser])

  const canCreateCatalog = isDanuser

  if (loading || isLoadingCreated || isLoadingAccess) {
    return (
      <Card className="border-green-100 bg-white">
        <CardHeader className="pb-0">
          <h2 className="text-xl font-bold">Your Catalogs</h2>
          <p className="text-sm text-muted-foreground">Catalogs you've created or have access to</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-md" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-green-100 bg-white">
      <CardHeader className="flex flex-row items-start justify-between pb-0">
        <div>
          <h2 className="text-xl font-bold">Your Catalogs</h2>
          <p className="text-sm text-muted-foreground">Catalogs you've created or have access to</p>
        </div>
        {canCreateCatalog && (
          <Button asChild size="sm" className="bg-green-600 hover:bg-green-700">
            <Link href="/dashboard/catalogs/new">
              <Plus className="mr-1 h-4 w-4" /> New
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {catalogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4">
              <LayoutGrid className="mx-auto h-16 w-16 text-muted-foreground/60" />
            </div>
            <h3 className="mb-1 text-lg font-medium">No catalogs yet</h3>
            <p className="mb-6 max-w-sm text-sm text-muted-foreground">
              {canCreateCatalog
                ? "Create your first catalog to start adding products."
                : "You don't have access to any catalogs yet."}
            </p>
            {canCreateCatalog && (
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <Link href="/dashboard/catalogs/new">Create Catalog</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {catalogs.map((catalog) => (
              <div key={catalog.id} className="flex items-start gap-4 rounded-lg p-3 transition-colors hover:bg-muted">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-green-100">
                  <LayoutGrid className="h-5 w-5 text-green-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">{catalog.name}</h3>
                    {catalog.organization_name && <Badge variant="outline">{catalog.organization_name}</Badge>}
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{catalog.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/catalogs/${catalog.id}`}>View</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/catalogs/${catalog.id}/edit`}>
                        <Settings className="mr-1 h-3 w-3" /> Manage
                      </Link>
                    </Button>
                    {catalog.by_organization && (
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/products/new?catalog=${catalog.id}&org=${catalog.by_organization}`}>
                          <Plus className="mr-1 h-3 w-3" /> Add Product
                        </Link>
                      </Button>
                    )}
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
