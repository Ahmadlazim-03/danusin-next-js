"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
        {isDanuser && (
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
              <div key={catalog.id} className="flex items-start gap-4 rounded-lg p-3 transition-colors hover:bg-muted">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-green-100">
                  <LayoutGrid className="h-5 w-5 text-green-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium">{catalog.name}</h3>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{catalog.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Created: {new Date(catalog.created).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
