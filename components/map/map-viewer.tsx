"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { pb } from "@/lib/pocketbase"
import { PointLayer, Scene } from "@antv/l7"
import { Mapbox } from "@antv/l7-maps"
import { useEffect, useRef, useState } from "react"

type MapViewerProps = {
  userLocation: { lon: number; lat: number } | null
}

type DanuserLocation = {
  id: string
  name: string
  location: { lon: number; lat: number }
}

export function MapViewer({ userLocation }: MapViewerProps) {
  const sceneRef = useRef<Scene | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [danuserLocations, setDanuserLocations] = useState<DanuserLocation[]>([])

  useEffect(() => {
    let isMounted = true

    async function fetchDanuserLocations() {
      try {
        // Fix the filter expression
        const result = await pb.collection("users").getList(1, 100, {
          filter: "isdanuser = true && location != null",
        })

        if (!isMounted) return

        const locations = result.items
          .filter((user: any) => user.location && user.location.lon && user.location.lat)
          .map((user: any) => ({
            id: user.id,
            name: user.name || "Danuser",
            location: user.location,
          }))

        setDanuserLocations(locations)
      } catch (error: any) {
        // Check if this is an auto-cancellation error (can be ignored)
        if (error.name !== "AbortError" && error.message !== "The request was autocancelled") {
          console.error("Error fetching danuser locations:", error)
        }
      }
    }

    fetchDanuserLocations()

    // Cleanup function to prevent setting state after unmount
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    // Default center if user location is not available
    const defaultCenter = [121.4737, 31.2304] // Example coordinates
    const center = userLocation ? [userLocation.lon, userLocation.lat] : defaultCenter

    // Initialize the map
    const scene = new Scene({
      id: containerRef.current,
      map: new Mapbox({
        style: "mapbox://styles/mapbox/light-v10",
        center: center,
        zoom: 11,
        pitch: 0,
        token: "pk.eyJ1IjoiZXZvcHRlY2giLCJhIjoiY21hcG85ZjhiMDByMDJqb2E1OGx4dGMyeSJ9.23o4bNoiuN4Xt9FpIfj1ow",
      }),
    })

    sceneRef.current = scene

    scene.on("loaded", () => {
      setLoading(false)

      // Add danuser locations to the map
      if (danuserLocations.length > 0) {
        const data = {
          type: "FeatureCollection",
          features: danuserLocations.map((danuser) => ({
            type: "Feature",
            properties: {
              name: danuser.name,
            },
            geometry: {
              type: "Point",
              coordinates: [danuser.location.lon, danuser.location.lat],
            },
          })),
        }

        const pointLayer = new PointLayer({})
          .source(data)
          .shape("circle")
          .size(20)
          .color("#00c16a")
          .style({
            opacity: 0.8,
            strokeWidth: 2,
            stroke: "#fff",
          })
          .animate(true)
          .active(true)

        scene.addLayer(pointLayer)
      }

      // Add user location if available and user is a danuser
      if (userLocation) {
        const userPoint = {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {
                name: "Your Location",
              },
              geometry: {
                type: "Point",
                coordinates: [userLocation.lon, userLocation.lat],
              },
            },
          ],
        }

        const userLayer = new PointLayer({}).source(userPoint).shape("circle").size(30).color("#0a5331").style({
          opacity: 1,
          strokeWidth: 3,
          stroke: "#fff",
        })

        scene.addLayer(userLayer)
      }
    })

    return () => {
      if (sceneRef.current) {
        sceneRef.current.destroy()
      }
    }
  }, [userLocation, danuserLocations])

  return (
    <div className="w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-green-50 bg-opacity-50 z-10">
          <div className="text-center">
            <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
            <p className="text-green-700 font-medium">Loading map...</p>
          </div>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
