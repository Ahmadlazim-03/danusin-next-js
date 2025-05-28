"use client"

import { INDONESIA_CENTER, useMap } from "@/components/map/map-provider";
import type { Feature, Geometry } from "geojson"; // For route geometry
import { Loader2 } from "lucide-react";
import mapboxgl, { LngLatLike } from "mapbox-gl"; // Import LngLatLike
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef, useState } from "react";

// Mapbox access token - ensure this is correctly set
// IMPORTANT: It's best practice to store access tokens in environment variables
// and not directly in the code, especially for production builds.
mapboxgl.accessToken = "pk.eyJ1IjoiZXZvcHRlY2giLCJhIjoiY21hcG85ZjhiMDByMDJqb2E1OGx4dGMyeSJ9.23o4bNoiuN4Xt9FpIfj1ow" // Your provided key

// --- Type Definitions ---
interface UserLocation {
  id: string // Important: Must be string to match keys in markersRef
  coordinates: LngLatLike // e.g., [lng, lat] or {lng, lat}
  name: string
  isActive?: boolean
  isCurrentUser?: boolean
  organizationName?: string;
  organizationId?: string | number | null;
}

interface RouteObject {
  geometry: Geometry // Expecting a GeoJSON Geometry object (e.g., LineString)
  // Include other properties if your route object from context has them (e.g., duration, distance)
}

// Define the expected shape from useMap for this specific component
// Ensure your actual MapContextType in map-provider.ts aligns with this,
// especially the 'route' and 'clearRoute' properties.
interface MapContextForMapboxMap {
  userLocations: UserLocation[]
  selectUser: (user: UserLocation | null) => void
  mapRef: React.MutableRefObject<mapboxgl.Map | null>
  route: RouteObject | null
  clearRoute: () => void
}
// --- End Type Definitions ---

export function MapboxMap() {
  const {
    userLocations,
    selectUser,
    mapRef,
    route,
    // clearRoute is destructured but not used directly in this component's rendering logic,
    // but it's good to have it in the context type if other parts of the app use it.
    // clearRoute
  } = useMap() as unknown as MapContextForMapboxMap; // Type assertion updated as per user's provided code

  const mapContainer = useRef<HTMLDivElement>(null)
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({})
  const [mapLoaded, setMapLoaded] = useState(false)
  const mapInitializedRef = useRef(false) // Prevents re-initializing the core map object

  // Initialize map only once
  useEffect(() => {
    // CRITICAL: The error "Type 'number[]' is not assignable to type 'LngLatLike | undefined'"
    // for the 'center' property below originates from the typing of INDONESIA_CENTER.
    // Ensure INDONESIA_CENTER is correctly typed as [number, number] or readonly [number, number]
    // in its definition file (e.g., @/components/map/map-provider.ts).
    // Example: export const INDONESIA_CENTER: [number, number] = [actualLongitude, actualLatitude];
    // Or: export const INDONESIA_CENTER = [actualLongitude, actualLatitude] as const;

    if (!mapContainer.current || mapInitializedRef.current) {
      if (mapRef.current && !mapInitializedRef.current) {
        console.log("Map instance already exists from provider. Component instance initializing its specific state.");
        setMapLoaded(true); // Assume map is loaded if instance exists
        mapInitializedRef.current = true; // Mark this instance as "initialized"
      }
      return;
    }

    mapInitializedRef.current = true // Mark that this component instance has run initialization logic
    console.log("Initializing map...")

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/evoptech/cmaqp7ltj00pw01s90cexcv56", // Your map style
      
      center: INDONESIA_CENTER, // ERROR HERE if INDONESIA_CENTER is not typed as [number, number] or LngLatLike
      zoom: 5,
      pitch: 45,
      bearing: 0,
      antialias: true,
    })

    mapRef.current = map // Store the map instance in the shared ref

    map.on("error", (e) => {
      console.error("Mapbox error:", e.error?.message || e.error || "Unknown Mapbox error")
    })

    map.on("load", () => {
      console.log("Map 'load' event fired")
      try {
        // Add Mapbox Terrain DEM source if not already present
        if (!map.getSource("mapbox-dem")) {
            map.addSource("mapbox-dem", {
              type: "raster-dem",
              url: "mapbox://mapbox.mapbox-terrain-dem-v1",
              tileSize: 512,
              maxzoom: 14,
            })
        }
        // Set terrain using the DEM source
        map.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 })

        // Add 3D buildings layer if not already present
        if (!map.getLayer("3d-buildings")) {
            map.addLayer({
              id: "3d-buildings",
              source: "composite", // Assumes your style has this source for buildings
              "source-layer": "building", // Check your style for the correct source-layer name
              filter: ["==", "extrude", "true"],
              type: "fill-extrusion",
              minzoom: 15,
              paint: {
                "fill-extrusion-color": [
                  "interpolate", ["linear"], ["get", "height"],
                  0, "#d1d5db", // light gray for shortest buildings
                  50, "#9ca3af", // medium gray
                  100, "#6b7280", // dark gray
                  200, "#4b5563", // darker
                  400, "#374151", // very dark gray for tallest buildings
                ],
                "fill-extrusion-height": ["get", "height"],
                "fill-extrusion-base": ["get", "min_height"], // Default to 0 if min_height is not available
                "fill-extrusion-opacity": 0.6,
              },
            });
        }

        // Add sky layer for atmospheric effects if not already present
        if (!map.getLayer("sky")) {
            map.addLayer({
              id: "sky",
              type: "sky",
              paint: {
                "sky-type": "atmosphere",
                "sky-atmosphere-sun": [0.0, 0.0], // Sun position [azimuth, polar angle]
                "sky-atmosphere-sun-intensity": 15,
              },
            });
        }
        setMapLoaded(true) // Indicate that map and initial layers are ready
      } catch (error) {
        console.error("Error setting up 3D map features:", error)
        setMapLoaded(true) // Still mark as loaded so UI is usable, even if 3D fails
      }
    })

    // Handle map clicks to deselect user if not clicking on a marker
    map.on("click", (e) => {
      const targetElement = e.originalEvent.target as HTMLElement
      if (!targetElement.closest(".mapboxgl-marker")) {
        selectUser(null)
      }
    })

    // Handle window resize to adjust map size
    const handleResize = () => {
      if (mapRef.current) {
        mapRef.current.resize()
      }
    }
    window.addEventListener("resize", handleResize)

    // Cleanup function for this effect
    return () => {
      window.removeEventListener("resize", handleResize)
      // The map instance itself is managed by mapRef from the provider and should not be destroyed here
      // unless this component is solely responsible for its lifecycle.
    }
  }, [mapRef, selectUser, INDONESIA_CENTER]) // INDONESIA_CENTER is a dependency

  // Update markers when user locations change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return

    const map = mapRef.current
    // console.log("Updating markers for userLocations:", userLocations.length) // Optional: for debugging

    const existingMarkerIds = Object.keys(markersRef.current)
    const newLocationIds = new Set(userLocations.map(user => user.id))

    // Remove markers for users no longer in userLocations
    existingMarkerIds.forEach((id) => {
      if (!newLocationIds.has(id)) {
        if (markersRef.current[id]) {
          markersRef.current[id].remove()
          delete markersRef.current[id]
        }
      }
    })

    // Add or update markers for each user location
    userLocations.forEach((user) => {
      const { id, coordinates, name, isActive, isCurrentUser } = user

      const createMarkerElement = (): HTMLElement => {
        const el = document.createElement("div")
        el.className = "relative marker-element marker-group" // Added marker-group for CSS hover
        el.setAttribute("data-user-id", id)

        const pin = document.createElement("div")
        pin.className = `w-6 h-6 rounded-full flex items-center justify-center shadow-lg transform-gpu transition-transform duration-300 cursor-pointer hover:scale-110 ${
          isCurrentUser ? "bg-green-500" : isActive ? "bg-blue-500" : "bg-gray-400"
        }`

        const innerCircle = document.createElement("div")
        innerCircle.className = "w-4 h-4 rounded-full bg-white flex items-center justify-center"
        const core = document.createElement("div")
        core.className = `w-2 h-2 rounded-full ${
          isCurrentUser ? "bg-green-600" : isActive ? "bg-blue-600" : "bg-gray-500"
        }`
        innerCircle.appendChild(core)
        pin.appendChild(innerCircle)
        el.appendChild(pin)

        if (isActive) {
          const pulse = document.createElement("div")
          pulse.className = `absolute top-0 left-0 w-full h-full rounded-full ${
            isCurrentUser ? "bg-green-500" : "bg-blue-500"
          } opacity-30 animate-ping pointer-events-none`
          el.insertBefore(pulse, pin)
        }

        const label = document.createElement("div")
        label.className =
          "marker-label absolute top-8 left-1/2 transform -translate-x-1/2 bg-background px-2 py-0.5 rounded text-xs font-medium shadow-md whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        label.textContent = name ?? "";
        el.appendChild(label)

        el.addEventListener("mouseenter", () => { pin.style.transform = "scale(1.1)"; });
        el.addEventListener("mouseleave", () => { pin.style.transform = "scale(1)"; });

        return el
      }

      if (markersRef.current[id]) {
        markersRef.current[id].setLngLat(coordinates)
        // TODO: Update marker style (element classes) if isActive/isCurrentUser changes.
      } else {
        const markerElement = createMarkerElement()
        const marker = new mapboxgl.Marker({ element: markerElement })
          .setLngLat(coordinates)
          .addTo(map)

        markerElement.addEventListener("click", (e) => {
          e.stopPropagation()
          // console.log("Marker clicked for user:", user.name); // Optional: for debugging
          setTimeout(() => {
            selectUser(user)
          }, 0);
        })
        markersRef.current[id] = marker
      }
    })
  }, [userLocations, mapLoaded, selectUser, mapRef])


  // Handle route display and updates
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return

    const map = mapRef.current
    const routeId = "route-line";
    const routeCasingId = "route-casing-line";
    const routeSourceId = "route-geojson-source";

    const removeRouteFromMap = () => {
      if (!map.isStyleLoaded()) return; // Ensure style is loaded before interacting
      if (map.getLayer(routeCasingId)) map.removeLayer(routeCasingId);
      if (map.getLayer(routeId)) map.removeLayer(routeId);
      if (map.getSource(routeSourceId)) map.removeSource(routeSourceId);
    };

    removeRouteFromMap();

    if (route && route.geometry) {
      try {
        map.addSource(routeSourceId, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: route.geometry,
          } as Feature,
        });

        map.addLayer({
            id: routeCasingId,
            type: "line",
            source: routeSourceId,
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": "#1e40af", "line-width": 11, "line-opacity": 0.5 },
          }
        );

        map.addLayer({
          id: routeId,
          type: "line",
          source: routeSourceId,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#3b82f6", "line-width": 7, "line-opacity": 0.85 },
        });

      } catch(error) {
          console.error("Error adding route to map:", error);
          removeRouteFromMap();
      }
    }

    return () => {
      if (mapRef.current && mapRef.current.isStyleLoaded()) {
        removeRouteFromMap();
      }
    };
  }, [route, mapLoaded, mapRef])

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainer} className="w-full h-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm z-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <span className="mt-3 text-md font-medium text-foreground">Loading 3D Map...</span>
        </div>
      )}
    </div>
  )
}

// Add this to your global CSS or a relevant CSS module for the marker label hover effect:
/*
.marker-group:hover .marker-label {
  opacity: 1;
}
*/
