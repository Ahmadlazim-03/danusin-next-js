"use client"

import { Loader2 } from "lucide-react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { useEffect, useRef, useState } from "react"
import { INDONESIA_CENTER, useMap } from "./map-provider"

// Mapbox access token - replace with your own
mapboxgl.accessToken = "pk.eyJ1IjoiYWhtYWRsYXppbSIsImEiOiJjbWFudjJscDMwMGJjMmpvcXdja29vN2h6In0.lbl0E3ixhWKnKuQ5T1aQcw"

export function MapboxMap() {
  const { userLocations, selectUser, mapRef } = useMap()
  const mapContainer = useRef<HTMLDivElement>(null)
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({})
  const [mapLoaded, setMapLoaded] = useState(false)
  const mapInitializedRef = useRef(false)

  // Initialize map only once
  useEffect(() => {
    if (!mapContainer.current || mapInitializedRef.current || mapRef.current) return

    mapInitializedRef.current = true
    console.log("Initializing map...")

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: INDONESIA_CENTER,
      zoom: 5,
      pitch: 45, // 3D view
      bearing: 0,
      antialias: true,
    })

    mapRef.current = map

    map.on("error", (e) => {
      console.error("Mapbox error:", e)
    })

    map.on("load", () => {
      console.log("Map loaded")
      // Add 3D terrain with error handling
      try {
        map.addSource("mapbox-dem", {
          type: "raster-dem",
          url: "mapbox://mapbox.mapbox-terrain-dem-v1",
          tileSize: 512,
          maxzoom: 14,
        })

        map.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 })

        // Add 3D buildings layer
        map.addLayer({
          id: "3d-buildings",
          source: "composite",
          "source-layer": "building",
          filter: ["==", "extrude", "true"],
          type: "fill-extrusion",
          minzoom: 15,
          paint: {
            "fill-extrusion-color": [
              "interpolate",
              ["linear"],
              ["get", "height"],
              0,
              "#d1d5db",
              50,
              "#9ca3af",
              100,
              "#6b7280",
              200,
              "#4b5563",
              400,
              "#374151",
            ],
            "fill-extrusion-height": ["get", "height"],
            "fill-extrusion-base": ["get", "min_height"],
            "fill-extrusion-opacity": 0.6,
          },
        })

        // Add sky layer for realistic 3D
        map.addLayer({
          id: "sky",
          type: "sky",
          paint: {
            "sky-type": "atmosphere",
            "sky-atmosphere-sun": [0.0, 0.0],
            "sky-atmosphere-sun-intensity": 15,
          },
        })

        setMapLoaded(true)
      } catch (error) {
        console.error("Error setting up 3D map features:", error)
        // Still mark as loaded so the UI is usable
        setMapLoaded(true)
      }
    })

    // Add a click handler to the map to ensure it doesn't interfere with marker clicks
    map.on("click", (e) => {
      // Only clear selection if we're clicking on the map itself, not a marker
      // Check if the click event target is a marker
      const target = e.originalEvent.target as HTMLElement
      const isMarker = target.closest(".mapboxgl-marker")

      if (!isMarker) {
        selectUser(null)
      }
    })

    return () => {
      // Do not remove the map on component unmount
      // This prevents the map from being reinitialized
    }
  }, [mapRef, selectUser])

  // Update markers when user locations change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return

    const map = mapRef.current
    console.log("Updating markers:", userLocations.length)

    // Remove markers that are no longer in the data
    Object.keys(markersRef.current).forEach((id) => {
      if (!userLocations.find((user) => user.id === id)) {
        markersRef.current[id].remove()
        delete markersRef.current[id]
      }
    })

    // Add or update markers
    userLocations.forEach((user) => {
      const { id, coordinates, name, isActive, isCurrentUser } = user

      // Create marker element
      const createMarkerElement = () => {
        const el = document.createElement("div")
        el.className = "relative marker-element"
        el.setAttribute("data-user-id", id)

        // Pin container
        const pin = document.createElement("div")
        pin.className = `w-6 h-6 rounded-full flex items-center justify-center shadow-lg transform-gpu transition-all duration-300 cursor-pointer ${
          isCurrentUser ? "bg-green-500" : isActive ? "bg-blue-500" : "bg-gray-400"
        }`

        // Inner circle
        const innerCircle = document.createElement("div")
        innerCircle.className = "w-4 h-4 rounded-full bg-white flex items-center justify-center"

        // Core
        const core = document.createElement("div")
        core.className = `w-2 h-2 rounded-full ${
          isCurrentUser ? "bg-green-600" : isActive ? "bg-blue-600" : "bg-gray-500"
        }`

        // Pulse animation for active users
        if (isActive) {
          const pulse = document.createElement("div")
          pulse.className = `absolute top-0 left-0 w-6 h-6 rounded-full ${
            isCurrentUser ? "bg-green-500" : "bg-blue-500"
          } opacity-30 animate-ping`
          el.appendChild(pulse)
        }

        innerCircle.appendChild(core)
        pin.appendChild(innerCircle)
        el.appendChild(pin)

        // Label
        const label = document.createElement("div")
        label.className =
          "absolute top-7 left-1/2 transform -translate-x-1/2 bg-white dark:bg-zinc-800 px-2 py-1 rounded text-xs font-medium shadow-md whitespace-nowrap"
        label.textContent = name
        label.style.display = "none" // Hide initially

        el.appendChild(label)

        // Show label on hover
        el.addEventListener("mouseenter", () => {
          label.style.display = "block"
        })

        el.addEventListener("mouseleave", () => {
          label.style.display = "none"
        })

        return el
      }

      if (markersRef.current[id]) {
        // Update existing marker position
        markersRef.current[id].setLngLat(coordinates)
      } else {
        // Create new marker
        const markerElement = createMarkerElement()
        const marker = new mapboxgl.Marker({ element: markerElement }).setLngLat(coordinates).addTo(map)

        // Add click handler directly to the marker element
        markerElement.addEventListener("click", (e) => {
          e.preventDefault()
          e.stopPropagation()
          console.log("Marker clicked for user:", user.name)

          // Use setTimeout to ensure this runs after any other click handlers
          setTimeout(() => {
            selectUser(user)
          }, 10)
        })

        markersRef.current[id] = marker
      }
    })
  }, [userLocations, mapLoaded, selectUser, mapRef])

  return (
    <div className="w-full h-screen">
      <div ref={mapContainer} className="w-full h-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-sm">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          <span className="ml-2 text-lg font-medium">Loading 3D map...</span>
        </div>
      )}
    </div>
  )
}
