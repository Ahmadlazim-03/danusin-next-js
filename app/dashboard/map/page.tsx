"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { LocationPrompt } from "@/components/map/location-prompt"
import { MapViewer } from "@/components/map/map-viewer"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { pb } from "@/lib/pocketbase"
import { AlertCircle, MapPin, Play, StopCircle } from "lucide-react"
import { useEffect, useRef, useState } from "react"

export default function StartDanusinPage() {
  const { user, updateUserLocation } = useAuth()
  const [locationPermission, setLocationPermission] = useState<"granted" | "denied" | "prompt">("prompt")
  const [userLocation, setUserLocation] = useState<{ lon: number; lat: number } | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [watchId, setWatchId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const isMounted = useRef(true)

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

    return () => {
      isMounted.current = false
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [user])

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!isMounted.current) return

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
          if (!isMounted.current) return

          console.error("Error getting location:", error)
          setLocationPermission("denied")
          setError(getGeolocationErrorMessage(error.code))
        },
      )
    }
  }

  const startSharing = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser")
      return
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to share your location",
        variant: "destructive",
      })
      return
    }

    // Start watching position
    const id = navigator.geolocation.watchPosition(
      (position) => {
        if (!isMounted.current) return

        const { latitude, longitude } = position.coords
        const location = { lat: latitude, lon: longitude }
        setUserLocation(location)
        setError(null)

        // Update user location in PocketBase
        updateUserLocation(longitude, latitude)
        updateUserDanusinStatus(true)
      },
      (error) => {
        if (!isMounted.current) return

        console.error("Error getting location:", error)
        setError(getGeolocationErrorMessage(error.code))
        stopSharing()
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )

    setWatchId(id)
    setIsSharing(true)

    toast({
      title: "Location sharing started",
      description: "Your location is now being shared with nearby Danusin users",
    })
  }

  const stopSharing = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }

    setIsSharing(false)

    // Update user to stop sharing
    if (user) {
      updateUserDanusinStatus(false)
    }

    toast({
      title: "Location sharing stopped",
      description: "Your location is no longer being shared",
    })
  }

  const updateUserDanusinStatus = async (status: boolean) => {
    if (!user || !isMounted.current) return

    try {
      await pb.collection("danusin_users").update(user.id, {
        isdanuser: status,
      })
    } catch (error) {
      if (!isMounted.current) return
      console.error("Error updating user status:", error)
    }
  }

  const handleAllowLocation = () => {
    getCurrentLocation()
  }

  const handleDenyLocation = () => {
    setShowPrompt(false)
    setLocationPermission("denied")
  }

  const getGeolocationErrorMessage = (code: number): string => {
    switch (code) {
      case 1:
        return "You denied permission to use your location"
      case 2:
        return "Location information is unavailable"
      case 3:
        return "The request to get your location timed out"
      default:
        return "An unknown error occurred"
    }
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Your Location</CardTitle>
            <CardDescription>Share your location to connect with nearby danusers</CardDescription>
          </CardHeader>
          <CardContent>
            {userLocation ? (
              <div className="space-y-2">
                <div className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4 text-green-500" />
                  <span>Location active</span>
                </div>
                <p className="text-sm text-muted-foreground">Latitude: {userLocation.lat.toFixed(6)}</p>
                <p className="text-sm text-muted-foreground">Longitude: {userLocation.lon.toFixed(6)}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Your location will appear here once you share it</p>
            )}
          </CardContent>
          <CardFooter>
            {isSharing ? (
              <Button variant="destructive" className="w-full" onClick={stopSharing}>
                <StopCircle className="mr-2 h-4 w-4" />
                Stop Sharing
              </Button>
            ) : (
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={startSharing}
                disabled={locationPermission === "denied"}
              >
                <Play className="mr-2 h-4 w-4" />
                Start Sharing
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card className="md:col-span-2 overflow-hidden">
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
    </div>
  )
}
