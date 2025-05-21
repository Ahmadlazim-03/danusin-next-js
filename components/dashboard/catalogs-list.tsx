"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { pb } from "@/lib/pocketbase"
import { useAuth } from "@/components/auth/auth-provider"
import Link from "next/link"
import { LayoutGrid, Plus } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

type Catalog = {
  id: string
  name: string
  description: string
  created: string
}

export function CatalogsList() {
  const { user, isDanuser } = useAuth()
  const [catalogs, setCatalogs] = useState<Catalog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCatalogs() {
      if (!user) return

      try {
        let catalogsData: Catalog[] = []

        if (isDanuser) {
          // For danusers, get catalogs they created
          const result = await pb.collection("danusin_catalog").getList(1, 10, {
            filter: `created_by="${user.id}"`,
            sort: "-created",
          })
          catalogsData = result.items as unknown as Catalog[]
        } else {
          // For regular users, get catalogs they have access to
          const result = await pb.collection("danusin_catalog_user").getList(1, 10, {
            filter: `user_id="${user.id}"`,
            expand: "catalog_id",
            sort: "-created",
          })
          catalogsData = result.items.map((item: any) => item.expand?.catalog_id).filter(Boolean)
        }

        setCatalogs(catalogsData)
      } catch (error) {
        console.error("Error fetching catalogs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCatalogs()
  }, [user, isDanuser])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Catalogs</CardTitle>
          <CardDescription>Catalogs you've created or have access to</CardDescription>
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
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Your Catalogs</CardTitle>
          <CardDescription>Catalogs you've created or have access to</CardDescription>
        </div>
        {isDanuser && (
          <Button asChild size="sm" className="bg-green-600 hover:bg-green-700">
            <Link href="/dashboard/catalogs/new">
              <Plus className="h-4 w-4 mr-1" /> New
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {catalogs.length === 0 ? (
          <div className="text-center py-6">
            <LayoutGrid className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <h3 className="font-medium text-lg mb-1">No catalogs yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              {isDanuser
                ? "Create your first catalog to start adding products."
                : "You don't have access to any catalogs yet."}
            </p>
            {isDanuser && (
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <Link href="/dashboard/catalogs/new">Create Catalog</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {catalogs.map((catalog) => (
              <Link
                key={catalog.id}
                href={`/catalog/${catalog.id}`}
                className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="h-10 w-10 rounded-md bg-green-100 flex items-center justify-center flex-shrink-0">
                  <LayoutGrid className="h-5 w-5 text-green-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm">{catalog.name}</h3>
                  <p className="text-muted-foreground text-xs line-clamp-2">{catalog.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Created: {new Date(catalog.created).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
