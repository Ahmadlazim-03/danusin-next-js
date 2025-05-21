"use client"

import { useEffect, useState } from "react"
import { pb } from "@/lib/pocketbase"
import { OrganizationCard } from "@/components/organization/organization-card"
import { Skeleton } from "@/components/ui/skeleton"

type Organization = {
  id: string
  organization_name: string
  organization_description: string
  organization_image: string
  organization_slug: string
  target: number
  target_progress: number
}

export function FeaturedOrganizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrganizations() {
      try {
        const records = await pb.collection("danusin_organization").getList(1, 4, {
          sort: "-created",
        })
        setOrganizations(records.items as unknown as Organization[])
      } catch (error) {
        console.error("Error fetching organizations:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrganizations()
  }, [])

  return (
    <section className="container mx-auto py-16 px-4">
      <h2 className="text-3xl font-bold mb-8 text-center">Featured Organizations</h2>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg overflow-hidden border border-green-100">
              <Skeleton className="h-48 w-full" />
              <div className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
                <div className="mt-4">
                  <Skeleton className="h-2 w-full mb-1" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {organizations.map((org) => (
            <OrganizationCard key={org.id} organization={org} />
          ))}
        </div>
      )}
    </section>
  )
}
