"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/auth-provider"
import { MapViewer } from "@/components/map/map-viewer"
import { LocationPrompt } from "@/components/map/location-prompt"
import { AlertCircle, MapPin } from "lucide-react"

export default function MapPage() {
  const { user, updateUserLocation } = useAuth()
  const [locationPermission, setLocationPermission] = useState<"granted" | "denied" | "prompt">("prompt")
  const [userLocation, setUserLocation] = useState<{ lon: number; lat: number } | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Check if user has already granted location permission
    if (navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        setLocationPermission(result.state as "granted" | "denied" | "prompt")

        if (result.state === "granted") {
          getCurrentLocation()
        } else if (result.state === "prompt") {
          setShowPrompt(true)
        }
      })
    } else {
      setShowPrompt(true)
    }

    // If user already has location stored, use that
    if (user?.location) {
      setUserLocation(user.location)
    }
  }, [user])

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          }
          setUserLocation(location)
          updateUserLocation(location.lon, location.lat)
          setLocationPermission("granted")
          setShowPrompt(false)
        },
        (error) => {
          console.error("Error getting location:", error)
          setLocationPermission("denied")
        },
      )
    }
  }

  const handleAllowLocation = () => {
    getCurrentLocation()
  }

  const handleDenyLocation = () => {
    setShowPrompt(false)
    setLocationPermission("denied")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Danuser Map</h1>
        <p className="text-muted-foreground">Explore danusers and organizations on the map</p>
      </div>

      {showPrompt && <LocationPrompt onAllow={handleAllowLocation} onDeny={handleDenyLocation} />}

      {locationPermission === "denied" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Location access denied</AlertTitle>
          <AlertDescription>
            You've denied location access. Some features may be limited. You can enable location access in your browser
            settings.
          </AlertDescription>
        </Alert>
      )}

      <Card className="overflow-hidden">
        <CardHeader className="pb-0">
          <CardTitle>Danuser Locations</CardTitle>
          <CardDescription>View entrepreneurs (danusers) on the map</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[600px] w-full relative">
            <MapViewer userLocation={userLocation} />

            {locationPermission !== "granted" && !showPrompt && (
              <div className="absolute bottom-4 right-4 z-10">
                <Button onClick={() => setShowPrompt(true)} className="bg-green-600 hover:bg-green-700">
                  <MapPin className="h-4 w-4 mr-2" />
                  Enable Location
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
