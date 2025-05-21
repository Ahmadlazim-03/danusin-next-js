"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { pb } from "@/lib/pocketbase"
import Image from "next/image"

type Banner = {
  id: string
  title: string
  order: number
  image_url: string
}

export function BannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBanners() {
      try {
        const records = await pb.collection("danusin_banners").getList(1, 10, {
          sort: "order",
        })
        setBanners(records.items as unknown as Banner[])
      } catch (error) {
        console.error("Error fetching banners:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBanners()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto py-12">
        <div className="h-64 bg-green-50 animate-pulse rounded-lg"></div>
      </div>
    )
  }

  if (banners.length === 0) {
    return null
  }

  return (
    <section className="container mx-auto py-12 px-4">
      <Carousel className="w-full">
        <CarouselContent>
          {banners.map((banner) => (
            <CarouselItem key={banner.id}>
              <Card className="border-0 overflow-hidden">
                <CardContent className="p-0 aspect-[3/1] relative">
                  <Image
                    src={banner.image_url || "/placeholder.svg"}
                    alt={banner.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                    <h3 className="text-white text-2xl font-bold">{banner.title}</h3>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-4" />
        <CarouselNext className="right-4" />
      </Carousel>
    </section>
  )
}
