"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Clock, Loader2, MapPin, MapPinOff, Users } from "lucide-react"
import { useEffect, useState } from "react"
import { useMap } from "./map-provider"

export function LocationControls() {
  const {
    isSharingLocation,
    isLoading,
    error,
    userLocations,
    startSharingLocation,
    stopSharingLocation,
    setError,
    lastLocationUpdate,
  } = useMap()
  const { user } = useAuth()

  const [permissionState, setPermissionState] = useState<PermissionState | "unknown">("unknown")
  const [timeAgo, setTimeAgo] = useState<string>("")

  // Format time ago for the last location update
  useEffect(() => {
    if (!lastLocationUpdate) {
      setTimeAgo("")
      return
    }

    const updateTimeAgo = () => {
      const now = new Date()
      const diffMs = now.getTime() - lastLocationUpdate.getTime()

      // Convert to appropriate time unit
      if (diffMs < 1000) {
        setTimeAgo("Just now")
      } else if (diffMs < 60000) {
        const seconds = Math.floor(diffMs / 1000)
        setTimeAgo(`${seconds} second${seconds > 1 ? "s" : ""} ago`)
      } else if (diffMs < 3600000) {
        const minutes = Math.floor(diffMs / 60000)
        setTimeAgo(`${minutes} minute${minutes > 1 ? "s" : ""} ago`)
      } else {
        const hours = Math.floor(diffMs / 3600000)
        setTimeAgo(`${hours} hour${hours > 1 ? "s" : ""} ago`)
      }
    }

    updateTimeAgo()
    const interval = setInterval(updateTimeAgo, 1000)

    return () => clearInterval(interval)
  }, [lastLocationUpdate])

  // Check for geolocation permission
  const checkLocationPermission = async () => {
    if (!navigator.permissions) {
      // Browser doesn't support permissions API, try geolocation directly
      navigator.geolocation.getCurrentPosition(
        () => setPermissionState("granted"),
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            setPermissionState("denied")
          } else {
            setPermissionState("prompt")
          }
        },
      )
      return
    }

    try {
      const permission = await navigator.permissions.query({ name: "geolocation" })
      setPermissionState(permission.state)

      // Listen for permission changes
      permission.onchange = () => {
        setPermissionState(permission.state)
      }
    } catch (err) {
      console.error("Error checking location permission:", err)
      setPermissionState("unknown")
    }
  }

  // Check permission on first render
  useEffect(() => {
    checkLocationPermission()
  }, [])

  const handleStartSharing = async () => {
    if (!user) {
      setError("You must be logged in to share your location")
      return
    }

    await checkLocationPermission()

    if (permissionState === "denied") {
      setError("Location permission is denied. Please enable location access in your browser settings.")
      return
    }

    startSharingLocation()
  }

  return (
    <Card className="w-80 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Location Sharing</CardTitle>
        <CardDescription>Share your location on the map</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!user && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>You need to be logged in to share your location.</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            <span className="font-medium">Active Users:</span>
          </div>
          <span className="font-bold text-lg">{userLocations.filter((u) => u.isActive).length}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-green-500" />
            <span className="font-medium">Status:</span>
          </div>
          <span className={`font-medium ${isSharingLocation ? "text-green-500" : "text-gray-500"}`}>
            {isSharingLocation ? "Sharing" : "Not Sharing"}
          </span>
        </div>

        {isSharingLocation && lastLocationUpdate && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <span className="font-medium">Last Update:</span>
            </div>
            <span className="font-medium text-blue-500">{timeAgo}</span>
          </div>
        )}
      </CardContent>

      <CardFooter>
        {isSharingLocation ? (
          <Button variant="destructive" className="w-full" onClick={stopSharingLocation} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPinOff className="mr-2 h-4 w-4" />}
            Stop Sharing
          </Button>
        ) : (
          <Button className="w-full" onClick={handleStartSharing} disabled={isLoading || !user}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
            {!user ? "Login Required" : "Start Sharing"}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
