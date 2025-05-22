"use client"

import { pb } from "@/lib/pocketbase"
import { PointLayer, Scene } from "@antv/l7"
import { Mapbox } from "@antv/l7-maps"
import { Loader } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface MapViewerProps {
  userLocation: { lon: number; lat: number } | null
}

export function MapViewer({ userLocation }: MapViewerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<Scene | null>(null)
  const userLayerRef = useRef<PointLayer | null>(null)
  const danusersLayerRef = useRef<PointLayer | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [danusers, setDanusers] = useState<any[]>([])

  // Fetch danusers from PocketBase
  useEffect(() => {
    const fetchDanusers = async () => {
      try {
        const result = await pb.collection("danusin_users").getList(1, 100, {
          filter: "isdanuser=true",
          $autoCancel: false,
        })

        setDanusers(result.items)
      } catch (err) {
        console.error("Error fetching danusers:", err)
      }
    }

    fetchDanusers()

    // Subscribe to real-time updates
    const unsubscribe = pb.collection("danusin_users").subscribe("*", (e) => {
      if (e.action === "create" || e.action === "update") {
        setDanusers((prev) => {
          const index = prev.findIndex((user) => user.id === e.record.id)
          if (index >= 0) {
            const newUsers = [...prev]
            newUsers[index] = e.record
            return newUsers
          }
          return [...prev, e.record]
        })
      } else if (e.action === "delete") {
        setDanusers((prev) => prev.filter((user) => user.id !== e.record.id))
      }
    })

    return () => {
      pb.collection("danusin_users").unsubscribe()
    }
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return

    const initializeMap = async () => {
      try {
        // Default center if user location is not available
        const defaultCenter = [0, 0]
        const center = userLocation ? [userLocation.lon, userLocation.lat] : defaultCenter

        const scene = new Scene({
          id: mapRef.current,
          map: new Mapbox({
            style: "mapbox://styles/mapbox/streets-v11",
            center,
            pitch: 0,
            zoom: userLocation ? 13 : 2,
            token: "pk.eyJ1IjoiYWhtYWRsYXppbSIsImEiOiJjbWFudjJscDMwMGJjMmpvcXdja29vN2h6In0.lbl0E3ixhWKnKuQ5T1aQcw",
          }),
        })

        scene.on("loaded", () => {
          setIsLoaded(true)
          sceneRef.current = scene
        })

        scene.on("error", (err) => {
          console.error("Map initialization error:", err)
          setError("Failed to initialize map")
        })

        return () => {
          if (scene) {
            scene.destroy()
          }
        }
      } catch (err) {
        console.error("Error initializing map:", err)
        setError("Failed to load map resources")
      }
    }

    initializeMap()
  }, [])

  // Update user marker when location changes
  useEffect(() => {
    if (!isLoaded || !sceneRef.current || !userLocation) return

    // Remove existing user layer if it exists
    if (userLayerRef.current) {
      sceneRef.current.removeLayer(userLayerRef.current)
    }

    // Create new user point layer
    const userLayer = new PointLayer({})
      .source(
        [
          {
            lng: userLocation.lon,
            lat: userLocation.lat,
            name: "Your Location",
          },
        ],
        {
          parser: { type: "json", x: "lng", y: "lat" },
        },
      )
      .shape("circle")
      .size(12)
      .color("#4CAF50")
      .style({
        opacity: 1,
        stroke: "#FFFFFF",
        strokeWidth: 2,
      })
      .animate(true)

    sceneRef.current.addLayer(userLayer)
    userLayerRef.current = userLayer

    // Center map on user location
    sceneRef.current.setCenter([userLocation.lon, userLocation.lat])
    sceneRef.current.setZoom(13)
  }, [isLoaded, userLocation])

  // Update danusers markers
  useEffect(() => {
    if (!isLoaded || !sceneRef.current) return

    // Remove existing danusers layer if it exists
    if (danusersLayerRef.current) {
      sceneRef.current.removeLayer(danusersLayerRef.current)
    }

    // Filter danusers with valid location data
    const validDanusers = danusers.filter((user) => user.location && user.location.lat && user.location.lon)

    if (validDanusers.length > 0) {
      // Create new danusers point layer
      const danusersLayer = new PointLayer({})
        .source(
          validDanusers.map((user) => ({
            lng: user.location.lon,
            lat: user.location.lat,
            name: user.name || "Danuser",
            id: user.id,
          })),
          {
            parser: { type: "json", x: "lng", y: "lat" },
          },
        )
        .shape("circle")
        .size(10)
        .color("#2196F3")
        .style({
          opacity: 0.8,
          stroke: "#FFFFFF",
          strokeWidth: 2,
        })
        .animate(true)

      sceneRef.current.addLayer(danusersLayer)
      danusersLayerRef.current = danusersLayer
    }
  }, [isLoaded, danusers])

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
        <Loader className="h-6 w-6 animate-spin mr-2" />
        <p>Loading map...</p>
      </div>
    )
  }

  return (
    <div className="h-full w-full rounded-lg overflow-hidden">
      <div ref={mapRef} className="h-full w-full" />
    </div>
  )
}
