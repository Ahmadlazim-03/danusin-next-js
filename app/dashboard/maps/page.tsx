"use client"

import { LocationControls } from "@/components/map/location-controls"
import { MapProvider } from "@/components/map/map-provider"
import { MapboxMap } from "@/components/map/mapbox-map"
import { SearchPanel } from "@/components/map/search-panel"
import { UserCard } from "@/components/map/user-card"
import { Toaster } from "@/components/ui/toaster"
import { Loader2 } from "lucide-react"
import { Suspense } from "react"

export default function MapPage() {
  return (
    <div className="w-full h-screen relative">
      <MapProvider>
        <div className="absolute top-4 left-16 z-10">
          <h1 className="text-3xl font-bold text-zinc-800 dark:text-white drop-shadow-md">Danusin Live Map</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">See users across Indonesia in real-time</p>
        </div>
        <SearchPanel />

        <div className="absolute top-4 right-4 z-10">
          <LocationControls />
        <UserCard />
        </div>

        <Suspense
          fallback={
            <div className="w-full h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              <span className="ml-2 text-lg font-medium">Loading map...</span>
            </div>
          }
        >
          <MapboxMap />
        </Suspense>

        <Toaster />
      </MapProvider>
    </div>
  )
}
