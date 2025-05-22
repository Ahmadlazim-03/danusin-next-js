"use client"

import { PointLayer, Scene } from '@antv/l7'
import { Mapbox } from '@antv/l7-maps'
import { Loader } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface RealtimeMapViewerProps {
  currentUserLocation: { lat: number; lng: number } | null
  nearbyUsers: any[]
  isSharing: boolean
}

export function RealtimeMapViewer({ currentUserLocation, nearbyUsers, isSharing }: RealtimeMapViewerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<Scene | null>(null)
  const currentUserLayerRef = useRef<PointLayer | null>(null)
  const nearbyUsersLayerRef = useRef<PointLayer | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load Mapbox and AntV L7
  useEffect(() => {
    // Ensure we're in a browser environment and mapRef is available
    if (typeof window === "undefined" || !mapRef.current) {
      setError("Map container not available")
      return
    }

    // Load Mapbox GL JS dynamically to ensure it's available
    const loadMapbox = async () => {
      try {
        // Check if Mapbox is already loaded
        if (!window.mapboxgl) {
          await import('mapbox-gl')
        }

        // Initialize AntV L7 Scene
        const scene = new Scene({
          id: mapRef.current!,
          map: new Mapbox({
            style: 'mapbox://styles/mapbox/streets-v11',
            center: currentUserLocation ? [currentUserLocation.lng, currentUserLocation.lat] : [0, 0],
            pitch: 45, // Enable 3D view
            zoom: 15,
            rotation: 0,
            token: 'pk.eyJ1IjoiYWhtYWRsYXppbSIsImEiOiJjbWFudjJscDMwMGJjMmpvcXdja29vN2h6In0.lbl0E3ixhWKnKuQ5T1aQcw'
          })
        })

        scene.on('loaded', () => {
          setIsLoaded(true)
        })

        scene.on('error', (err) => {
          console.error("Scene initialization error:", err)
          setError("Failed to initialize map")
        })

        sceneRef.current = scene
      } catch (err) {
        console.error("Error loading Mapbox or initializing map:", err)
        setError("Failed to load map resources")
      }
    }

    loadMapbox()

    return () => {
      if (sceneRef.current) {
        sceneRef.current.destroy()
        sceneRef.current = null
      }
    }
  }, [])

  // Update current user marker
  useEffect(() => {
    if (!isLoaded || !sceneRef.current || !currentUserLocation) return

    // Remove existing current user layer
    if (currentUserLayerRef.current) {
      sceneRef.current.removeLayer(currentUserLayerRef.current)
    }

    // Create new point layer for current user
    const currentUserLayer = new PointLayer({})
      .source([{
        lng: currentUserLocation.lng,
        lat: currentUserLocation.lat,
        name: "You"
      }], {
        parser: { type: 'json', x: 'lng', y: 'lat' }
      })
      .shape('circle')
      .size(10)
      .color('#4CAF50')
      .style({
        opacity: 1,
        stroke: '#FFFFFF',
        strokeWidth: 2
      })

    sceneRef.current.addLayer(currentUserLayer)
    currentUserLayerRef.current = currentUserLayer

    // Center map on current user
    sceneRef.current.setCenter([currentUserLocation.lng, currentUserLocation.lat])
  }, [isLoaded, currentUserLocation])

  // Update nearby users markers
  useEffect(() => {
    if (!isLoaded || !sceneRef.current) return

    // Remove existing nearby users layer
    if (nearbyUsersLayerRef.current) {
      sceneRef.current.removeLayer(nearbyUsersLayerRef.current)
    }

    // Create new point layer for nearby users
    const nearbyUsersData = nearbyUsers
      .filter(user => user.location && user.location.lat && user.location.lng)
      .map(user => ({
        lng: user.location.lng,
        lat: user.location.lat,
        name: user.name || "Danusin User",
        id: user.id
      }))

    if (nearbyUsersData.length > 0) {
      const nearbyUsersLayer = new PointLayer({})
        .source(nearbyUsersData, {
          parser: { type: 'json', x: 'lng', y: 'lat' }
        })
        .shape('circle')
        .size(8)
        .color('#2196F3')
        .style({
          opacity: 1,
          stroke: '#FFFFFF',
          strokeWidth: 2
        })

      sceneRef.current.addLayer(nearbyUsersLayer)
      nearbyUsersLayerRef.current = nearbyUsersLayer
    }
  }, [isLoaded, nearbyUsers])

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